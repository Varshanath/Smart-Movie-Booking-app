package com.example.smartmoviebooking.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = androidx.compose.ui.graphics.Color(0xFF7C4DFF),
    secondary = androidx.compose.ui.graphics.Color(0xFFFF6F61)
)

private val LightColorScheme = lightColorScheme(
    primary = androidx.compose.ui.graphics.Color(0xFF7C4DFF),
    secondary = androidx.compose.ui.graphics.Color(0xFFFF6F61)
)

@Composable
fun SmartMovieBookingTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
