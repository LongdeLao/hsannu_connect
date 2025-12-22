package com.example.hsannu.auth

data class User(
    val id: Int,
    val role: String,
    val username: String,
    val name: String,
    val email: String,
    val additionalRoles: List<String>
) 