package com.example.smartmoviebooking

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.smartmoviebooking.ui.theme.SmartMovieBookingTheme
import kotlinx.coroutines.launch

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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigator() {
    var isRegistered by remember { mutableStateOf(true) } // Start with true to show Login screen first
    var isLoggedIn by remember { mutableStateOf(false) }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    if (!isLoggedIn) {
        if (isRegistered) {
            LoginScreen(
                onLogin = { isLoggedIn = true },
                onNavigateToRegister = { isRegistered = false }
            )
        } else {
            RegistrationScreen(
                onRegister = { isRegistered = true },
                onNavigateToLogin = { isRegistered = true }
            )
        }
    } else {
        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                ModalDrawerSheet {
                    Spacer(modifier = Modifier.height(16.dp))
                    NavigationDrawerItem(
                        label = { Text("Logout") },
                        selected = false,
                        onClick = {
                            scope.launch {
                                drawerState.close()
                                isLoggedIn = false
                            }
                        }
                    )
                }
            }
        ) {
            Scaffold(
                topBar = {
                    TopAppBar(
                        title = { Text("Smart Movie Booking") },
                        navigationIcon = {
                            IconButton(onClick = {
                                scope.launch { drawerState.open() }
                            }) {
                                Icon(Icons.Default.Menu, contentDescription = "Menu")
                            }
                        }
                    )
                }
            ) { padding ->
                Surface(modifier = Modifier.padding(padding)) {
                    HomeScreen()
                }
            }
        }
    }
}
