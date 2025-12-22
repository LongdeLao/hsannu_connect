# HSANNU Connect Design Guidelines

## Table of Contents
- [Overview](#overview)
- [Design System](#design-system)
- [Layout Patterns](#layout-patterns)
- [Component Architecture](#component-architecture)
- [Styling Conventions](#styling-conventions)
- [Navigation Structure](#navigation-structure)
- [Form Design](#form-design)
- [Data Display](#data-display)
- [Interactive Elements](#interactive-elements)
- [Development Standards](#development-standards)

## Overview

HSANNU Connect is a modern educational platform built with Next.js 14, TypeScript, and Tailwind CSS. The design follows a clean, professional aesthetic with consistent patterns across all pages and components.

### Core Design Principles
- **Consistency**: Uniform spacing, typography, and component behavior
- **Accessibility**: WCAG 2.1 compliant with proper ARIA labels and keyboard navigation
- **Responsiveness**: Mobile-first approach with seamless desktop scaling
- **Performance**: Optimized loading states and smooth transitions
- **User Experience**: Intuitive navigation and clear visual hierarchy

## Design System

### Color Palette
The application uses CSS custom properties for theming with light/dark mode support:

```css
/* Primary Colors */
--background: hsl(0 0% 100%)           /* Main background */
--foreground: hsl(222.2 84% 4.9%)      /* Primary text */
--muted: hsl(210 40% 98%)              /* Secondary backgrounds */
--muted-foreground: hsl(215.4 16.3% 46.9%) /* Secondary text */
--border: hsl(214.3 31.8% 91.4%)      /* Borders and dividers */

/* Interactive Elements */
--primary: hsl(222.2 47.4% 11.2%)     /* Buttons, links */
--primary-foreground: hsl(210 40% 98%) /* Button text */
--secondary: hsl(210 40% 96%)          /* Secondary buttons */
--accent: hsl(210 40% 96%)             /* Hover states */
```

### Typography Scale
```css
/* Headings */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }    /* Page titles */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; } /* Section headers */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; } /* Subsections */

/* Body Text */
.text-base { font-size: 1rem; line-height: 1.5rem; }   /* Default text */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; } /* Labels, captions */
.text-xs { font-size: 0.75rem; line-height: 1rem; }    /* Fine print */
```

### Spacing System
```css
/* Standard spacing scale (Tailwind) */
.p-6 { padding: 1.5rem; }      /* Page containers */
.mb-6 { margin-bottom: 1.5rem; } /* Section separation */
.mb-4 { margin-bottom: 1rem; }   /* Element separation */
.gap-4 { gap: 1rem; }            /* Flex/grid gaps */
.space-y-2 > * + * { margin-top: 0.5rem; } /* Form elements */
```

## Layout Patterns

### Page Structure
All pages follow this consistent structure:

```tsx
<div className="p-6">
  {/* Breadcrumbs */}
  <div className="mb-4">
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/shared" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Page Name</span>
        </nav>
  </div>

  {/* Header */}
  <div className="mb-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Page Title</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Page description
        </p>
      </div>
      {/* Action buttons */}
    </div>
  </div>

  {/* Content */}
  <div className="space-y-6">
    {/* Page content */}
  </div>
</div>
```

### Responsive Breakpoints
```css
/* Mobile First */
/* sm: 640px */
/* md: 768px */
/* lg: 1024px */
/* xl: 1280px */
/* 2xl: 1536px */
```

## Component Architecture

### shadcn/ui Components
The project uses shadcn/ui as the base component library with consistent customizations:

#### Buttons
```tsx
// Primary action
<Button>Primary Action</Button>

// Secondary action
<Button variant="outline">Secondary Action</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Small buttons for compact spaces
<Button size="sm">Small Action</Button>
```

#### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

#### Dialogs
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleAction}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Custom Components

#### Loading States
```tsx
// Skeleton loading
<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>

// Spinner for actions
<Button disabled={loading}>
  {loading ? "Loading..." : "Submit"}
</Button>
```

#### Empty States
```tsx
<div className="text-center py-12">
  <div className="text-muted-foreground mb-4">
    <Icon className="h-12 w-12 mx-auto mb-2" />
    <p>No items found</p>
  </div>
  <Button>Add New Item</Button>
</div>
```

## Styling Conventions

### CSS Class Naming & Organization
- Use Tailwind utility classes for styling
- Group related classes logically: layout → spacing → colors → typography → effects
- Use consistent patterns across similar components
- Avoid custom CSS unless absolutely necessary

```tsx
// Good - Logical grouping
<div className="flex items-center justify-between p-4 bg-background border rounded-lg hover:shadow-md transition-shadow">
  <h2 className="text-lg font-semibold text-foreground">Title</h2>
  <Button size="sm">Action</Button>
</div>

// Bad - Random ordering
<div className="text-lg border bg-background flex rounded-lg p-4 items-center justify-between">
```

### Component Styling Patterns

#### Container Patterns
```tsx
// Page container
<div className="p-6">

// Content container with max width
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Card container
<div className="bg-background border rounded-lg p-4 shadow-sm">

// Section container
<div className="space-y-6">
```

#### Layout Patterns
```tsx
// Flex layouts
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="flex flex-col space-y-2">

// Grid layouts
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// Responsive spacing
<div className="space-y-4 md:space-y-6">
```

#### Typography Patterns
```tsx
// Page titles
<h1 className="text-2xl font-semibold text-foreground">

// Section headers
<h2 className="text-xl font-semibold text-foreground">

// Subsection headers
<h3 className="text-lg font-medium text-foreground">

// Body text
<p className="text-base text-foreground">

// Secondary text
<p className="text-sm text-muted-foreground">

// Labels
<label className="text-sm font-medium text-foreground">

// Captions
<span className="text-xs text-muted-foreground">
```

#### Color Usage Patterns
```tsx
// Backgrounds
<div className="bg-background">        // Main content
<div className="bg-muted">             // Secondary areas
<div className="bg-card">              // Card backgrounds
<div className="bg-primary">           // Primary actions
<div className="bg-secondary">         // Secondary actions
<div className="bg-destructive">       // Error/danger states

// Text colors
<span className="text-foreground">     // Primary text
<span className="text-muted-foreground"> // Secondary text
<span className="text-primary">        // Links/primary actions
<span className="text-destructive">    // Errors
<span className="text-green-600">      // Success (custom when needed)

// Borders
<div className="border">               // Default borders
<div className="border-primary">       // Primary borders
<div className="border-destructive">   // Error borders
<div className="border-muted">         // Subtle borders
```

#### Interactive States
```tsx
// Hover states
<div className="hover:bg-muted transition-colors">
<Button className="hover:bg-primary/90">
<Link className="hover:text-primary hover:underline">

// Focus states
<Input className="focus:ring-2 focus:ring-primary focus:border-primary">
<Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">

// Active states
<Button className="active:scale-95 transition-transform">
<div className="active:bg-muted">

// Disabled states
<Button disabled className="opacity-50 cursor-not-allowed">
<Input disabled className="bg-muted cursor-not-allowed">
```

#### Animation & Transition Patterns
```tsx
// Standard transitions
<div className="transition-colors duration-200">
<div className="transition-all duration-300 ease-in-out">
<div className="transition-shadow duration-200">

// Loading animations
<div className="animate-pulse">
<div className="animate-spin">
<div className="animate-bounce">

// Custom animations for specific components
<div className="animate-in slide-in-from-right duration-300">
<div className="animate-out fade-out duration-200">
```

### Responsive Design Patterns

#### Breakpoint Usage
```tsx
// Mobile-first approach
<div className="text-sm md:text-base lg:text-lg">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
<div className="px-4 md:px-6 lg:px-8">

// Hide/show elements
<div className="hidden md:block">        // Hidden on mobile
<div className="block md:hidden">        // Only on mobile
<div className="md:hidden lg:block">     // Hidden on tablet only

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">
<div className="space-y-2 md:space-y-4 lg:space-y-6">
```

#### Common Responsive Patterns
```tsx
// Navigation
<nav className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">

// Cards
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// Dialog sizing
<DialogContent className="w-full max-w-sm md:max-w-md lg:max-w-lg">

// Text sizing
<h1 className="text-xl md:text-2xl lg:text-3xl">
```

### Form Styling Patterns

#### Form Layouts
```tsx
// Standard form
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="field">Field Label</Label>
    <Input id="field" placeholder="Enter value" />
  </div>
</form>

// Grid form layout
<form className="grid gap-4 md:grid-cols-2">
  <div className="space-y-2">
    <Label>Field 1</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>Field 2</Label>
    <Input />
  </div>
</form>

// Inline form elements
<div className="flex items-end gap-2">
  <div className="flex-1">
    <Label>Search</Label>
    <Input />
  </div>
  <Button>Submit</Button>
</div>
```

#### Form States
```tsx
// Error state
<div className="space-y-2">
  <Label className="text-destructive">Field with Error</Label>
  <Input className="border-destructive focus:ring-destructive" />
  <p className="text-sm text-destructive">Error message here</p>
</div>

// Success state
<div className="space-y-2">
  <Label>Valid Field</Label>
  <Input className="border-green-500 focus:ring-green-500" />
  <p className="text-sm text-green-600">✓ Looks good!</p>
</div>

// Loading state
<div className="space-y-2">
  <Label>Loading Field</Label>
  <div className="relative">
    <Input disabled />
    <div className="absolute right-2 top-1/2 -translate-y-1/2">
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  </div>
</div>
```

### Data Display Styling

#### Table Styling
```tsx
<div className="border rounded-lg overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="bg-muted/50">
        <TableHead className="font-semibold">Name</TableHead>
        <TableHead className="font-semibold">Status</TableHead>
        <TableHead className="text-right font-semibold">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="hover:bg-muted/50 transition-colors">
        <TableCell className="font-medium">Item name</TableCell>
        <TableCell>
          <Badge variant="secondary">Active</Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button size="sm" variant="outline">Edit</Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

#### Card Styling Variants
```tsx
// Basic card
<Card className="p-4">
  <CardContent>Content</CardContent>
</Card>

// Interactive card
<Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
  <CardContent className="p-4">Content</CardContent>
</Card>

// Status cards with color coding
<Card className="border-l-4 border-l-green-500 bg-green-50/50">
  <CardContent className="p-4">Success content</CardContent>
</Card>

<Card className="border-l-4 border-l-red-500 bg-red-50/50">
  <CardContent className="p-4">Error content</CardContent>
</Card>

// Compact card
<Card className="p-3 bg-muted/30">
  <div className="text-sm">Compact content</div>
</Card>
```

#### Badge and Status Styling
```tsx
// Status badges
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Draft</Badge>

// Custom colored badges
<Badge className="bg-green-100 text-green-800 hover:bg-green-200">
  Success
</Badge>
<Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
  Warning
</Badge>
<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
  Info
</Badge>
```

### Loading and Empty States

#### Loading Skeletons
```tsx
// Text skeleton
<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>

// Card skeleton
<Card className="p-4">
  <div className="space-y-3">
    <Skeleton className="h-5 w-1/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
</Card>

// Avatar skeleton
<div className="flex items-center space-x-3">
  <Skeleton className="h-10 w-10 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-3 w-16" />
  </div>
</div>
```

#### Empty States
```tsx
// Standard empty state
<div className="text-center py-12">
  <div className="text-muted-foreground mb-4">
    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
    <h3 className="text-lg font-medium mb-1">No documents found</h3>
    <p className="text-sm">Get started by uploading your first document</p>
  </div>
  <Button>
    <Plus className="h-4 w-4 mr-2" />
    Upload Document
  </Button>
</div>

// Compact empty state
<div className="text-center py-8 text-muted-foreground">
  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
  <p className="text-sm">No results found</p>
</div>
```

### Dark Mode Considerations
```tsx
// Use CSS variables for colors that work in both themes
<div className="bg-background text-foreground border-border">

// Avoid hardcoded colors that don't adapt
// Bad: bg-white text-black border-gray-300
// Good: bg-background text-foreground border-border

// Images and icons should work in both themes
<img className="dark:invert" src="logo.svg" alt="Logo" />
```

### State Management for Styling
- Use React hooks for local state
- Implement loading, error, and success states consistently
- Provide user feedback for all actions

```tsx
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const handleAction = async () => {
  setLoading(true)
  setError(null)
  try {
    await performAction()
    // Success feedback
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

### Custom CSS Guidelines
When Tailwind utilities are insufficient, follow these patterns:

```css
/* Use CSS custom properties for consistency */
.custom-component {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}

/* Scope custom styles to components */
.survey-card {
  @apply bg-background border rounded-lg p-4 hover:shadow-md transition-shadow;
}

/* Use Tailwind's @apply directive when possible */
.btn-custom {
  @apply px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors;
}
```

## Navigation Structure

### Sidebar Navigation
The application uses a collapsible sidebar with role-based navigation:

```tsx
// Navigation structure
const navigation = {
  shared: [
    { name: "Dashboard", href: "/shared", icon: Home },
    { name: "Documents", href: "/shared/documents", icon: FileText },
    { name: "Surveys", href: "/shared/surveys", icon: Vote },
    { name: "Attendance", href: "/shared/attendance", icon: Calendar },
    { name: "Settings", href: "/shared/settings", icon: Settings },
  ],
  teacher: [
    // Teacher-specific navigation
  ],
  admin: [
    // Admin-specific navigation
  ]
}
```

### Breadcrumb Navigation
Every page includes breadcrumbs for navigation context:

```tsx
<nav className="flex items-center space-x-2 text-sm text-muted-foreground">
  <Link href="/shared" className="hover:text-foreground transition-colors">
    <Home className="h-4 w-4" />
  </Link>
  <ChevronRight className="h-4 w-4" />
  <Link href="/shared/documents" className="hover:text-foreground transition-colors">
    Documents
  </Link>
  <ChevronRight className="h-4 w-4" />
  <span className="text-foreground font-medium">Current Page</span>
</nav>
```

## Form Design

### Form Layout
```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="field">Field Label</Label>
    <Input 
      id="field" 
      placeholder="Placeholder text"
      value={value}
      onChange={handleChange}
    />
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
</form>
```

### Form Validation
- Provide real-time validation feedback
- Use consistent error messaging
- Disable submit buttons during validation or submission

### Dialog Forms
For complex forms in dialogs, use sticky headers and footers:

```tsx
<DialogContent className="h-[85vh] w-full max-w-xl overflow-hidden p-0 flex flex-col">
  <DialogHeader className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur">
    {/* Header content */}
  </DialogHeader>
  <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
    {/* Form content */}
  </div>
  <DialogFooter className="sticky bottom-0 z-10 border-t bg-background/80 px-6 py-4 backdrop-blur">
    {/* Action buttons */}
  </DialogFooter>
</DialogContent>
```

## Data Display

### Tables
Use consistent table styling with proper spacing and borders:

```tsx
<div className="border rounded-lg overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="bg-muted/50">
        <TableHead>Column 1</TableHead>
        <TableHead>Column 2</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell>{item.value}</TableCell>
          <TableCell className="text-right">
            <Button size="sm" variant="outline">Edit</Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

### Cards Grid
For displaying collections of items:

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Card content */}
      </CardContent>
    </Card>
  ))}
</div>
```

### Tabs
For organizing related content:

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="mb-4">
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    {/* Tab 1 content */}
  </TabsContent>
  <TabsContent value="tab2">
    {/* Tab 2 content */}
  </TabsContent>
</Tabs>
```

## Interactive Elements

### Hover States
All interactive elements should have hover states:

```tsx
<Card className="cursor-pointer hover:shadow-md transition-shadow">
<Button className="hover:bg-primary/90 transition-colors">
<Link className="hover:text-foreground transition-colors">
```

### Focus States
Ensure proper keyboard navigation:

```tsx
<Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
<Input className="focus:ring-2 focus:ring-primary">
```

### Loading States
Provide feedback during async operations:

```tsx
<Button disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </>
  ) : (
    "Submit"
  )}
</Button>
```

## Development Standards

### File Organization
```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth routes
│   ├── shared/            # Shared pages
│   ├── teacher/           # Teacher pages
│   └── admin/             # Admin pages
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── custom/           # Custom components
├── lib/                  # Utilities and configurations
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

### TypeScript Standards
- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Use generic types where appropriate
- Avoid `any` type usage

```tsx
interface Document {
  id: string
  file_name: string
  file_description?: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_by: number
  uploader_name?: string
  created_at: string
  updated_at: string
  status: string
}
```

### Error Handling
- Implement consistent error boundaries
- Provide user-friendly error messages
- Log errors appropriately for debugging

```tsx
try {
  const response = await fetch('/api/endpoint')
  if (!response.ok) {
    throw new Error('Failed to fetch data')
  }
  const data = await response.json()
  return data
} catch (error) {
  console.error('API Error:', error)
  throw new Error('Something went wrong. Please try again.')
}
```

### Performance Considerations
- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Use Next.js built-in optimizations

### Accessibility
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation
- Maintain color contrast ratios
- Test with screen readers

### Testing
- Write unit tests for utility functions
- Test component rendering and interactions
- Implement integration tests for critical flows
- Use proper test data and mocks

## API Integration

### Fetch Patterns
```tsx
const useFetchData = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  return { data, loading, error, refetch: () => fetchData() }
}
```

### Error Response Handling
```tsx
const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Handle unauthorized
    router.push('/login')
  } else if (error.response?.status === 403) {
    // Handle forbidden
    toast.error('You do not have permission to perform this action')
  } else {
    // Handle general errors
    toast.error(error.message || 'Something went wrong')
  }
}
```

## Conclusion

These guidelines ensure consistency across the HSANNU Connect platform. When implementing new features or modifying existing ones, refer to these patterns and maintain the established design language. Always prioritize user experience, accessibility, and performance in your implementations.

For questions or clarifications about these guidelines, refer to existing implementations in the codebase or consult with the development team. 
 