package com.example.hsannu.student

data class Subject(
	val subject: String,
	val code: String,
	val initials: String,
	val teachingGroup: String,
	val teacherId: Int,
	val teacherName: String
)

data class StudentProfile(
	val id: Int,
	val fullName: String,
	val yearGroup: String?,
	val groupName: String?,
	val classes: List<Subject>
) 