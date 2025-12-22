package com.example.hsannu.auth

import android.content.Context
import android.provider.Settings
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL

class AuthRepository {
    fun login(
        context: Context,
        username: String,
        password: String,
        callback: (success: Boolean, statusCode: Int?, errorMessage: String?, user: User?) -> Unit
    ) {
        if (username.isBlank() || password.isBlank()) {
            callback(false, null, "Username and password are required.", null)
            return
        }

        Thread {
            var connection: HttpURLConnection? = null
            try {
                val url = URL(ApiConfig.BASE_URL + ApiConfig.LOGIN_PATH)
                connection = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = ApiConfig.TIMEOUT_MS
                    readTimeout = ApiConfig.TIMEOUT_MS
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                }

                val deviceId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
                val body = JSONObject().apply {
                    put("username", username)
                    put("password", password)
                    if (!deviceId.isNullOrEmpty()) put("deviceID", deviceId)
                }.toString()

                connection.outputStream.use { os: OutputStream ->
                    os.write(body.toByteArray(Charsets.UTF_8))
                }

                val status = connection.responseCode
                val stream = if (status in 200..299) connection.inputStream else connection.errorStream
                val response = BufferedReader(InputStreamReader(stream)).use { it.readText() }

                val json = try { JSONObject(response) } catch (_: Exception) { JSONObject() }

                if (status !in 200..299) {
                    val err = json.optString("error").ifBlank { response.ifBlank { "Login failed." } }
                    callback(false, status, err, null)
                    return@Thread
                }

                if (json.has("error")) {
                    callback(false, status, json.optString("error"), null)
                    return@Thread
                }

                val id = json.optInt("id", 0)
                val name = json.optString("name", "")
                val uname = json.optString("username", username)
                val role = json.optString("role", "")
                val email = json.optString("email", "")
                val rolesArray = json.optJSONArray("additional_roles") ?: JSONArray()
                val roles = mutableListOf<String>()
                for (i in 0 until rolesArray.length()) {
                    roles.add(rolesArray.optString(i))
                }
                val user = User(id = id, role = role, username = uname, name = name, email = email, additionalRoles = roles)

                SessionManager(context).saveUser(user)
                callback(true, status, null, user)
            } catch (e: Exception) {
                callback(false, null, e.localizedMessage ?: "Network error", null)
            } finally {
                connection?.disconnect()
            }
        }.start()
    }
} 