import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
	const cookieStore = await cookies();
	const isLoggedIn = cookieStore.get("loggedIn")?.value === "true";
	const userRole = cookieStore.get("userRole")?.value;

	if (!isLoggedIn) {
		redirect("/login");
	}

	if (userRole === "student") {
		redirect("/student");
	}

	if (userRole === "staff" || userRole === "teacher" || userRole === "admin") {
		redirect("/staff");
	}

	redirect("/student");
}
