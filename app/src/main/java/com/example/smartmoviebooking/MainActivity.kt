package com.example.smartmoviebooking

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.smartmoviebooking.ui.theme.SmartMovieBookingTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SmartMovieBookingTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    AppNavigator()
                }
            }
        }
    }
}

@Composable
fun AppNavigator() {
    val isRegistered = remember { mutableStateOf(false) }
    val isLoggedIn = remember { mutableStateOf(false) }

    if (!isRegistered.value) {
        RegistrationScreen(onRegister = { isRegistered.value = true })
    } else if (!isLoggedIn.value) {
        LoginScreen(onLogin = { isLoggedIn.value = true })
    } else {
        HomeScreen()
    }
}
