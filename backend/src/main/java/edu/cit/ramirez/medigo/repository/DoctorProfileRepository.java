package edu.cit.ramirez.medigo.repository;

import edu.cit.ramirez.medigo.entity.DoctorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long> {

    Optional<DoctorProfile> findByDoctorId(Long doctorId);

    @Query("""
            SELECT dp
            FROM DoctorProfile dp
            JOIN FETCH dp.doctor d
            WHERE dp.verified = true
              AND (
                :query IS NULL OR :query = '' OR
                LOWER(dp.specialization) LIKE LOWER(CONCAT('%', :query, '%')) OR
                LOWER(dp.clinicName) LIKE LOWER(CONCAT('%', :query, '%')) OR
                LOWER(dp.clinicAddress) LIKE LOWER(CONCAT('%', :query, '%')) OR
                LOWER(d.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY d.fullName ASC
            """)
    List<DoctorProfile> searchVerifiedDoctors(@Param("query") String query);
}
