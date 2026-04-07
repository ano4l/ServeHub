package com.marketplace.common.api;

import com.marketplace.common.application.FileStorageService;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/uploads/files")
public class FileServingController {

    private final FileStorageService fileStorageService;

    public FileServingController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/**")
    public ResponseEntity<Resource> serveFile(HttpServletRequest request) {
        String fullPath = request.getRequestURI();
        String relativePath = fullPath.substring("/uploads/files/".length());

        try {
            Path filePath = fileStorageService.resolve(relativePath);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
