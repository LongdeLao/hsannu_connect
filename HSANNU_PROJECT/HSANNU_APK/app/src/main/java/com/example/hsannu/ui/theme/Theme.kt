package com.example.hsannu.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val LightColors = lightColorScheme(
	primary = Color(0xFF007AFF),
	onPrimary = Color.White,
	secondary = Color(0xFF0A84FF),
	tertiary = Color(0xFF34C759),
	background = Color(0xFFFFFFFF),
	surface = Color(0xFFFFFFFF),
	onSurface = Color(0xFF000000)
)

private val DarkColors = darkColorScheme(
	primary = Color(0xFF0A84FF),
	onPrimary = Color.White,
	secondary = Color(0xFF0A84FF),
	tertiary = Color(0xFF30D158),
	background = Color(0xFF1C1C1E),
	surface = Color(0xFF1C1C1E),
	onSurface = Color(0xFFFFFFFF)
)

@Composable
fun HSANNUTheme(
	useDarkTheme: Boolean = isSystemInDarkTheme(),
	useDynamicColor: Boolean = false,
	content: @Composable () -> Unit
) {
	val context = LocalContext.current
	val colorScheme = when {
		useDynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && useDarkTheme -> dynamicDarkColorScheme(context)
		useDynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !useDarkTheme -> dynamicLightColorScheme(context)
		useDarkTheme -> DarkColors
		else -> LightColors
	}
	MaterialTheme(
		colorScheme = colorScheme,
		typography = androidx.compose.material3.Typography(),
		content = content
	)
} 