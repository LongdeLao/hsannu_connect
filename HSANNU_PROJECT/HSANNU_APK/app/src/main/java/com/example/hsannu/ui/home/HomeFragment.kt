package com.example.hsannu.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.example.hsannu.auth.SessionManager
import com.example.hsannu.databinding.FragmentHomeBinding
import com.google.android.material.chip.Chip

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        val root: View = binding.root

        val user = SessionManager(requireContext()).getUser()
        binding.textGreeting.text = user?.name?.let { getString(com.example.hsannu.R.string.greeting, it) }
            ?: getString(com.example.hsannu.R.string.greeting, "")
        binding.textEmail.text = user?.email ?: ""

        binding.chipRoles.removeAllViews()
        user?.additionalRoles?.forEach { role ->
            val chip = Chip(requireContext()).apply {
                text = role
                isCheckable = false
            }
            binding.chipRoles.addView(chip)
        }

        return root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}