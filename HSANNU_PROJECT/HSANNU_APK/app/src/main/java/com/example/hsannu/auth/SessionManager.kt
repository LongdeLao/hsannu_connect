package com.example.hsannu.auth

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray

class SessionManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("hsannu_prefs", Context.MODE_PRIVATE)

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_LOGGED_IN, false)

    fun saveUser(user: User) {
        prefs.edit()
            .putBoolean(KEY_LOGGED_IN, true)
            .putInt(KEY_USER_ID, user.id)
            .putString(KEY_ROLE, user.role)
            .putString(KEY_USERNAME, user.username)
            .putString(KEY_NAME, user.name)
            .putString(KEY_EMAIL, user.email)
            .putString(KEY_ADDITIONAL_ROLES, JSONArray(user.additionalRoles).toString())
            .apply()
    }

    fun getUser(): User? {
        if (!isLoggedIn()) return null
        val id = prefs.getInt(KEY_USER_ID, 0)
        val role = prefs.getString(KEY_ROLE, "") ?: ""
        val username = prefs.getString(KEY_USERNAME, "") ?: ""
        val name = prefs.getString(KEY_NAME, "") ?: ""
        val email = prefs.getString(KEY_EMAIL, "") ?: ""
        val rolesJson = prefs.getString(KEY_ADDITIONAL_ROLES, "[]") ?: "[]"
        val rolesArray = JSONArray(rolesJson)
        val roles = mutableListOf<String>()
        for (i in 0 until rolesArray.length()) {
            roles.add(rolesArray.optString(i))
        }
        return User(id, role, username, name, email, roles)
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val KEY_LOGGED_IN = "loggedIn"
        private const val KEY_USER_ID = "userID"
        private const val KEY_ROLE = "role"
        private const val KEY_USERNAME = "username"
        private const val KEY_NAME = "name"
        private const val KEY_EMAIL = "email"
        private const val KEY_ADDITIONAL_ROLES = "additionalRoles"
    }
} 