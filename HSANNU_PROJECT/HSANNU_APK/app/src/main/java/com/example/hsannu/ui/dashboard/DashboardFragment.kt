package com.example.hsannu.ui.dashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.example.hsannu.R
import com.example.hsannu.auth.SessionManager
import com.example.hsannu.ui.theme.HSANNUTheme
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import com.example.hsannu.student.StudentRepository
import com.example.hsannu.student.Subject
import androidx.compose.material3.ElevatedCard

class DashboardFragment : Fragment() {

	override fun onCreateView(
		inflater: LayoutInflater,
		container: ViewGroup?,
		savedInstanceState: Bundle?
	): View {
		val navController = findNavController()
		return ComposeView(requireContext()).apply {
			setContent {
				HSANNUTheme {
					StudentDashboardScreen(
						onClassesClick = { navController.navigate(R.id.navigation_student_classes) }
					)
				}
			}
		}
	}
}

@Composable
fun RoleChip(
	text: String,
	icon: ImageVector,
	foreground: Color,
	background: Color
) {
	Row(
		modifier = Modifier
			.clip(RoundedCornerShape(5.dp))
			.background(background)
			.padding(horizontal = 6.dp, vertical = 4.dp),
		verticalAlignment = Alignment.CenterVertically
	) {
		Icon(imageVector = icon, contentDescription = null, tint = foreground, modifier = Modifier.size(14.dp))
		Spacer(modifier = Modifier.width(4.dp))
		Text(
			text = text,
			color = foreground,
			style = MaterialTheme.typography.labelSmall
		)
	}
}

@Composable
fun StudentDashboardScreen(padding: PaddingValues = PaddingValues(16.dp), onClassesClick: () -> Unit) {
	val context = LocalContext.current
	val sessionManager = remember { SessionManager(context) }
	val user = remember { sessionManager.getUser() }
	val firstName = remember(user) {
		(user?.name ?: "Marcus").trim().split(" ").firstOrNull().orEmpty().ifEmpty { "Marcus" }
	}

	val primary = MaterialTheme.colorScheme.primary
	val chipForeground = primary
	val chipBackground = primary.copy(alpha = 0.15f)

	val classes = remember { mutableStateListOf<Subject>() }
	var loading by remember { mutableStateOf(true) }
	var errorMessage by remember { mutableStateOf<String?>(null) }

	LaunchedEffect(Unit) {
		StudentRepository().fetchStudentClasses(context) { success, _, error, data ->
			loading = false
			if (!success) {
				errorMessage = error
			} else {
				classes.clear()
				if (data != null) classes.addAll(data)
			}
		}
	}

	Surface(color = MaterialTheme.colorScheme.background) {
		Column(
			modifier = Modifier
				.fillMaxSize()
				.padding(padding)
				.verticalScroll(rememberScrollState()),
			verticalArrangement = Arrangement.spacedBy(12.dp)
		) {
			Row(
				modifier = Modifier.fillMaxWidth(),
				verticalAlignment = Alignment.CenterVertically
			) {
				Text(
					text = "Hey, $firstName",
					style = MaterialTheme.typography.headlineMedium,
					fontWeight = FontWeight.Bold
				)
				Spacer(modifier = Modifier.weight(1f))
				RoleChip(
					text = "Student",
					icon = Icons.Filled.Person,
					foreground = chipForeground,
					background = chipBackground
				)
			}

			Divider()

			Row(
				modifier = Modifier.fillMaxWidth(),
				verticalAlignment = Alignment.CenterVertically
			) {
				Text(
					text = "Classes",
					style = MaterialTheme.typography.titleMedium,
					color = MaterialTheme.colorScheme.primary,
					modifier = Modifier.clickable { onClassesClick() }
				)
				Spacer(modifier = Modifier.weight(1f))
				Text(
					text = "View all",
					style = MaterialTheme.typography.labelLarge,
					color = MaterialTheme.colorScheme.secondary,
					modifier = Modifier.clickable { onClassesClick() }
				)
			}

			when {
				loading -> Text("Loading classes...", style = MaterialTheme.typography.bodyMedium)
				errorMessage != null -> Text(errorMessage!!, color = MaterialTheme.colorScheme.error)
				classes.isEmpty() -> Text("No classes to show.", style = MaterialTheme.typography.bodyMedium)
				else -> {
					Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
						for (item in classes.take(3)) {
							ElevatedCard {
								Column(modifier = Modifier.padding(12.dp)) {
									ClassRowCompact(item)
								}
							}
						}
					}
				}
			}
		}
	}
}

@Composable
private fun ClassRowCompact(item: Subject) {
	Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
		Text(item.subject, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
		Text("${item.code} • ${item.teachingGroup}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
		if (item.teacherName.isNotBlank()) {
			Text("Teacher: ${item.teacherName}", style = MaterialTheme.typography.bodySmall)
		}
	}
}