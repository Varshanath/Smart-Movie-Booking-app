package com.example.smartmoviebooking.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val gender: String,
    val location: String,
    val moviePreference: List<String>
)

data class AuthResponse(
    val message: String,
    val user: User? = null
)

data class User(
    val id: String,
    val email: String,
    val name: String
)

interface AuthApi {
    @POST("api/users/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("api/users/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
}
