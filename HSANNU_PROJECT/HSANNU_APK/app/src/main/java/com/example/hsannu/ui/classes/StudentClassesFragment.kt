package com.example.hsannu.ui.classes

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.fragment.app.Fragment
import com.example.hsannu.ui.theme.HSANNUTheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.ui.platform.LocalContext
import com.example.hsannu.student.StudentRepository
import com.example.hsannu.student.Subject
import androidx.compose.material3.ElevatedCard
import androidx.compose.foundation.layout.PaddingValues

class StudentClassesFragment : Fragment() {
	override fun onCreateView(
		inflater: LayoutInflater,
		container: ViewGroup?,
		savedInstanceState: Bundle?
	): View {
		return ComposeView(requireContext()).apply {
			setContent {
				HSANNUTheme {
					StudentClassesScreen()
				}
			}
		}
	}
}

@Composable
fun StudentClassesScreen() {
	val context = LocalContext.current
	var loading by remember { mutableStateOf(true) }
	var errorMessage by remember { mutableStateOf<String?>(null) }
	val classes = remember { mutableStateListOf<Subject>() }

	LaunchedEffect(Unit) {
		StudentRepository().fetchStudentClasses(context) { success, _, error, data ->
			loading = false
			if (!success) {
				errorMessage = error ?: "Failed to load classes"
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
				.padding(16.dp),
			verticalArrangement = Arrangement.spacedBy(12.dp)
		) {
			Text(
				text = "Classes",
				style = MaterialTheme.typography.headlineSmall,
				fontWeight = FontWeight.SemiBold
			)

			when {
				loading -> Text("Loading...", style = MaterialTheme.typography.bodyMedium)
				errorMessage != null -> Text(errorMessage!!, color = MaterialTheme.colorScheme.error)
				classes.isEmpty() -> Text("No classes found.", style = MaterialTheme.typography.bodyMedium)
				else -> {
					LazyColumn(
						verticalArrangement = Arrangement.spacedBy(12.dp),
						contentPadding = PaddingValues(vertical = 4.dp)
					) {
						items(classes) { item ->
							ElevatedCard {
								Column(modifier = Modifier.padding(12.dp)) {
									ClassRow(item)
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
private fun ClassRow(item: Subject) {
	Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
		Text(item.subject, style = MaterialTheme.typography.titleMedium)
		Text("${item.code} • ${item.teachingGroup}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
		if (item.teacherName.isNotBlank()) {
			Text("Teacher: ${item.teacherName}", style = MaterialTheme.typography.bodySmall)
		}
	}
} 