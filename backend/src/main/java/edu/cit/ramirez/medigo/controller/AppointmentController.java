package edu.cit.ramirez.medigo.controller;

import edu.cit.ramirez.medigo.dto.*;
import edu.cit.ramirez.medigo.response.ApiResponse;
import edu.cit.ramirez.medigo.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping("/doctors/search")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<DoctorProfileDto>> searchDoctors(
            @RequestParam(value = "q", required = false) String query) {
        return ApiResponse.ok(appointmentService.searchDoctors(query));
    }

    @PutMapping("/doctors/me/profile")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<DoctorProfileDto> upsertDoctorProfile(
            Principal principal,
            @Valid @RequestBody DoctorProfileUpsertRequest body) {
        return ApiResponse.ok(appointmentService.upsertDoctorProfile(principal.getName(), body));
    }

    @GetMapping("/doctors/me/profile")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<DoctorProfileDto> myDoctorProfile(Principal principal) {
        return ApiResponse.ok(appointmentService.getMyDoctorProfile(principal.getName()));
    }

    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AppointmentDto> createAppointment(
            Principal principal,
            @Valid @RequestBody AppointmentCreateRequest body) {
        return ApiResponse.ok(appointmentService.createAppointment(principal.getName(), body));
    }

    @GetMapping("/appointments")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<AppointmentDto>> myAppointments(Principal principal) {
        return ApiResponse.ok(appointmentService.getMyAppointments(principal.getName()));
    }

    @PutMapping("/appointments/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<AppointmentDto> updateAppointment(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody AppointmentUpdateRequest body) {
        return ApiResponse.ok(appointmentService.updateAppointment(principal.getName(), id, body));
    }

    @PutMapping("/appointments/{id}/cancel")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<AppointmentDto> cancelAppointment(Principal principal, @PathVariable Long id) {
        return ApiResponse.ok(appointmentService.cancelAppointment(principal.getName(), id));
    }

    @DeleteMapping("/appointments/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<AppointmentDto> deleteAppointment(Principal principal, @PathVariable Long id) {
        return ApiResponse.ok(appointmentService.deleteAppointment(principal.getName(), id));
    }

    @PutMapping("/appointments/{id}/status")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<AppointmentDto> updateAppointmentStatus(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody AppointmentStatusUpdateRequest body) {
        return ApiResponse.ok(appointmentService.updateStatus(principal.getName(), id, body));
    }
}
