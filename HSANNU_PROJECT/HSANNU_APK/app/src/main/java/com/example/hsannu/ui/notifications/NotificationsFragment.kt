package com.example.hsannu.ui.notifications

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Divider
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.fragment.app.Fragment
import com.example.hsannu.R
import com.example.hsannu.ui.theme.HSANNUTheme

class NotificationsFragment : Fragment() {

	override fun onCreateView(
		inflater: LayoutInflater,
		container: ViewGroup?,
		savedInstanceState: Bundle?
	): View {
		return ComposeView(requireContext()).apply {
			setContent {
				HSANNUTheme {
					MessagesScreen()
				}
			}
		}
	}
}

@Composable
fun MessagesScreen(padding: PaddingValues = PaddingValues(0.dp)) {
	val messages = listOf(
		"Welcome to HSANNU!",
		"Your event starts in 1 hour",
		"New message from Admin"
	)
	Column(
		modifier = Modifier
			.fillMaxSize()
			.padding(padding)
	) {
		Text(
			text = "Messages",
			style = MaterialTheme.typography.headlineMedium,
			modifier = Modifier.padding(16.dp)
		)
		Divider()
		LazyColumn(
			modifier = Modifier.fillMaxSize(),
			contentPadding = PaddingValues(vertical = 8.dp)
		) {
			items(messages) { msg ->
				ListItem(
					headlineContent = { Text(text = msg) },
					leadingContent = {
						Image(
							painter = painterResource(id = R.drawable.ic_notifications_black_24dp),
							contentDescription = null
						)
					}
				)
				Divider()
			}
		}
	}
}