package edu.cit.ramirez.medigo.features.admin;

import edu.cit.ramirez.medigo.features.doctor.dto.DoctorProfileDto;
import edu.cit.ramirez.medigo.shared.exception.ResourceNotFoundException;
import edu.cit.ramirez.medigo.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.util.List;
import java.util.Map;

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

    /**
     * Rejects a doctor — stores rejection reason and deletes profile so doctor can re-submit.
     * Body: { "reason": "..." }
     */
    @PutMapping("/doctors/{doctorId}/reject")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<DoctorProfileDto> rejectDoctor(
            @PathVariable Long doctorId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ApiResponse.ok(adminService.rejectDoctor(doctorId, reason));
    }

    /**
     * Serve a document file for admin review.
     * Accessible to ADMIN role (bypasses the DOCTOR-only /doctors/me/documents endpoint).
     */
    @GetMapping("/documents/{filename:.+}")
    public ResponseEntity<Resource> serveDocument(@PathVariable String filename) {
        try {
            Resource resource = adminService.serveDocument(filename);
            String contentType = "application/octet-stream";
            String lower = filename.toLowerCase();
            if (lower.endsWith(".pdf"))                                   contentType = "application/pdf";
            else if (lower.endsWith(".png"))                              contentType = "image/png";
            else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg"))   contentType = "image/jpeg";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
