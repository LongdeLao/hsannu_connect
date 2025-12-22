package com.example.hsannu.ui.events

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.unit.dp
import androidx.fragment.app.Fragment
import com.example.hsannu.ui.theme.HSANNUTheme

class EventsFragment : Fragment() {

	override fun onCreateView(
		inflater: LayoutInflater,
		container: ViewGroup?,
		savedInstanceState: Bundle?
	): View {
		return ComposeView(requireContext()).apply {
			setContent {
				HSANNUTheme {
					EventsScreen()
				}
			}
		}
	}
}

@Composable
fun EventsScreen(padding: PaddingValues = PaddingValues(16.dp)) {
	val events = listOf(
		"Orientation Week - Oct 12",
		"Tech Talk: Compose Basics - Oct 20",
		"Annual Meetup - Nov 5"
	)
	Column(
		modifier = Modifier
			.fillMaxSize()
			.padding(padding),
		verticalArrangement = Arrangement.spacedBy(12.dp)
	) {
		Text(
			text = "Events",
			style = MaterialTheme.typography.headlineMedium
		)
		LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
			items(events) { event ->
				Card(colors = CardDefaults.cardColors()) {
					Text(
						text = event,
						modifier = Modifier.padding(16.dp),
						style = MaterialTheme.typography.bodyLarge
					)
				}
			}
		}
	}
} 