package edu.cit.ramirez.medigo.features.admin;

import edu.cit.ramirez.medigo.features.doctor.dto.DoctorProfileDto;
import edu.cit.ramirez.medigo.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    /** Returns all doctor profiles that are not yet verified (pending approval). */
    @GetMapping("/doctors/pending")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<DoctorProfileDto>> getPendingDoctors() {
        return ApiResponse.ok(adminService.getPendingDoctors());
    }

    /** Approves a doctor — sets verified = true. */
    @PutMapping("/doctors/{doctorId}/approve")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<DoctorProfileDto> approveDoctor(@PathVariable Long doctorId) {
        return ApiResponse.ok(adminService.approveDoctor(doctorId));
    }

    /** Rejects a doctor — deletes their profile so they can re-submit. */
    @PutMapping("/doctors/{doctorId}/reject")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<DoctorProfileDto> rejectDoctor(@PathVariable Long doctorId) {
        return ApiResponse.ok(adminService.rejectDoctor(doctorId));
    }
}
