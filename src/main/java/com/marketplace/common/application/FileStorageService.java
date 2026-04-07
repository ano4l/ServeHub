package com.marketplace.common.application;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private final Path uploadDir;
    private final Set<String> allowedTypes;

    public FileStorageService(
            @Value("${app.file-upload.storage-dir:uploads}") String storageDir,
            @Value("${app.file-upload.allowed-types:jpg,jpeg,png,pdf,doc,docx}") String allowedTypesStr) {
        this.uploadDir = Paths.get(storageDir).toAbsolutePath().normalize();
        this.allowedTypes = Set.of(allowedTypesStr.toLowerCase().split(","));
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + this.uploadDir, e);
        }
    }

    public String store(MultipartFile file, String subdirectory) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        String originalName = file.getOriginalFilename();
        String extension = getExtension(originalName);
        if (!allowedTypes.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException(
                "File type '" + extension + "' not allowed. Allowed: " + allowedTypes);
        }

        String storedName = UUID.randomUUID() + "." + extension;
        Path targetDir = uploadDir.resolve(subdirectory);
        try {
            Files.createDirectories(targetDir);
            Path targetPath = targetDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored file: {}", targetPath);
            return subdirectory + "/" + storedName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public void delete(String relativePath) {
        try {
            Path filePath = uploadDir.resolve(relativePath).normalize();
            if (!filePath.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Invalid file path");
            }
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete file {}: {}", relativePath, e.getMessage());
        }
    }

    public Path resolve(String relativePath) {
        Path filePath = uploadDir.resolve(relativePath).normalize();
        if (!filePath.startsWith(uploadDir)) {
            throw new IllegalArgumentException("Invalid file path");
        }
        return filePath;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
