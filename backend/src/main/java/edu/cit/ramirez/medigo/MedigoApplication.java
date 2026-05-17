package edu.cit.ramirez.medigo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MedigoApplication {

	public static void main(String[] args) {
		SpringApplication.run(MedigoApplication.class, args);
	}

}
