package com.example.hsannu

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.hsannu.auth.AuthRepository
import com.example.hsannu.auth.SessionManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

class LoginActivity : AppCompatActivity() {

    private lateinit var usernameLayout: TextInputLayout
    private lateinit var passwordLayout: TextInputLayout
    private lateinit var usernameEdit: TextInputEditText
    private lateinit var passwordEdit: TextInputEditText
    private lateinit var signInButton: MaterialButton
    private lateinit var progressBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val session = SessionManager(this)
        if (session.isLoggedIn()) {
            startMainAndFinish()
            return
        }

        setContentView(R.layout.activity_login)

        usernameLayout = findViewById(R.id.text_input_username)
        passwordLayout = findViewById(R.id.text_input_password)
        usernameEdit = findViewById(R.id.edit_username)
        passwordEdit = findViewById(R.id.edit_password)
        signInButton = findViewById(R.id.button_sign_in)
        progressBar = findViewById(R.id.progress)

        passwordEdit.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                attemptLogin()
                true
            } else false
        }

        signInButton.setOnClickListener { attemptLogin() }
    }

    private fun attemptLogin() {
        val username = (usernameEdit.text?.toString() ?: "").trim()
        val password = passwordEdit.text?.toString() ?: ""

        var valid = true
        if (username.isEmpty()) {
            usernameLayout.error = getString(R.string.error_required)
            valid = false
        } else {
            usernameLayout.error = null
        }
        if (password.isEmpty()) {
            passwordLayout.error = getString(R.string.error_required)
            valid = false
        } else {
            passwordLayout.error = null
        }
        if (!valid) return

        setLoading(true)
        AuthRepository().login(this, username, password) { success, status, error, _ ->
            runOnUiThread {
                setLoading(false)
                if (success) {
                    startMainAndFinish()
                } else {
                    val message = when (status) {
                        401 -> getString(R.string.error_incorrect_credentials)
                        404 -> getString(R.string.error_user_not_found)
                        else -> error ?: getString(R.string.error_login_failed)
                    }
                    Toast.makeText(this, message, Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun startMainAndFinish() {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        }
        startActivity(intent)
        finish()
    }

    private fun setLoading(loading: Boolean) {
        progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        signInButton.isEnabled = !loading
        usernameEdit.isEnabled = !loading
        passwordEdit.isEnabled = !loading
    }
} 