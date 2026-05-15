package edu.cit.ramirez.medigo.features.appointment;

import edu.cit.ramirez.medigo.features.appointment.dto.*;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorProfileDto;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorProfileUpsertRequest;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorSpecializationChangeRequestCreateRequest;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorSpecializationChangeRequestDto;
import edu.cit.ramirez.medigo.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @Value("${app.upload.dir:uploads/doctor-docs}")
    private String uploadDir;

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

    @PostMapping("/doctors/me/specialization-change-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DoctorSpecializationChangeRequestDto> requestSpecializationChange(
            Principal principal,
            @Valid @RequestBody DoctorSpecializationChangeRequestCreateRequest body) {
        return ApiResponse.ok(appointmentService.requestSpecializationChange(principal.getName(), body));
    }

    @GetMapping("/doctors/me/specialization-change-requests")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<DoctorSpecializationChangeRequestDto>> mySpecializationChangeRequests(
            Principal principal) {
        return ApiResponse.ok(appointmentService.getMySpecializationChangeRequests(principal.getName()));
    }

    /** Upload a single document for the authenticated doctor.
     *  docType must be one of: medical_license, prc_id, board_certificate, government_id */
    @PostMapping(value = "/doctors/me/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<DoctorProfileDto> uploadDocument(
            Principal principal,
            @RequestParam("docType") String docType,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(appointmentService.uploadDoctorDocument(principal.getName(), docType, file));
    }

    /** Serve an uploaded document file by filename. */
    @GetMapping("/doctors/me/documents/{filename:.+}")
    public ResponseEntity<Resource> serveDocument(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = "application/octet-stream";
            String lower = filename.toLowerCase();
            if (lower.endsWith(".pdf"))  contentType = "application/pdf";
            else if (lower.endsWith(".png"))  contentType = "image/png";
            else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
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
