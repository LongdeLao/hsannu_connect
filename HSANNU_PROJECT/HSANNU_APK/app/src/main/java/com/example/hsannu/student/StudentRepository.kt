package com.example.hsannu.student

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.example.hsannu.auth.ApiConfig
import com.example.hsannu.auth.SessionManager
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class StudentRepository {
	private fun postToMain(block: () -> Unit) {
		Handler(Looper.getMainLooper()).post(block)
	}

	fun fetchStudentClasses(
		context: Context,
		callback: (success: Boolean, statusCode: Int?, errorMessage: String?, classes: List<Subject>?) -> Unit
	) {
		val user = SessionManager(context).getUser()
		if (user == null || user.id == 0) {
			postToMain { callback(false, null, "Not logged in", null) }
			return
		}

		Thread {
			var connection: HttpURLConnection? = null
			try {
				val url = URL(ApiConfig.BASE_URL + "/api/get_student_information?userid=" + user.id)
				connection = (url.openConnection() as HttpURLConnection).apply {
					requestMethod = "GET"
					connectTimeout = ApiConfig.TIMEOUT_MS
					readTimeout = ApiConfig.TIMEOUT_MS
				}

				val status = connection.responseCode
				val stream = if (status in 200..299) connection.inputStream else connection.errorStream
				val response = BufferedReader(InputStreamReader(stream)).use { it.readText() }

				val json = JSONObject(response)
				if (status !in 200..299) {
					val err = json.optString("message").ifBlank { response.ifBlank { "Request failed." } }
					postToMain { callback(false, status, err, null) }
					return@Thread
				}

				if (!json.optBoolean("success", false)) {
					val err = json.optString("message").ifBlank { "Unknown error" }
					postToMain { callback(false, status, err, null) }
					return@Thread
				}

				val studentObj = json.optJSONObject("student") ?: JSONObject()
				val classesArray = studentObj.optJSONArray("classes")
				val classes = mutableListOf<Subject>()
				if (classesArray != null) {
					for (i in 0 until classesArray.length()) {
						val item = classesArray.optJSONObject(i) ?: continue
						val subject = item.optString("subject")
						val code = item.optString("code")
						val initials = item.optString("initials")
						val teachingGroup = item.optString("teaching_group")
						val teacherId = item.optInt("teacher_id", 0)
						val teacherName = item.optString("teacher_name")
						classes.add(
							Subject(
								subject = subject,
								code = code,
								initials = initials,
								teachingGroup = teachingGroup,
								teacherId = teacherId,
								teacherName = teacherName
							)
						)
					}
				}

				postToMain { callback(true, status, null, classes) }
			} catch (e: Exception) {
				postToMain { callback(false, null, e.localizedMessage ?: "Network error", null) }
			} finally {
				connection?.disconnect()
			}
		}.start()
	}
} 