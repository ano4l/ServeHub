package com.marketplace.common.api;

import com.marketplace.common.application.FileStorageService;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.provider.domain.ProviderDocument;
import com.marketplace.provider.domain.ProviderDocumentRepository;
import com.marketplace.provider.domain.ProviderProfile;
import com.marketplace.provider.domain.ProviderProfileRepository;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/uploads")
public class FileUploadController {

    private final FileStorageService fileStorageService;
    private final CurrentUserService currentUserService;
    private final ProviderProfileRepository providerRepository;
    private final ProviderDocumentRepository documentRepository;

    public FileUploadController(FileStorageService fileStorageService,
                                CurrentUserService currentUserService,
                                ProviderProfileRepository providerRepository,
                                ProviderDocumentRepository documentRepository) {
        this.fileStorageService = fileStorageService;
        this.currentUserService = currentUserService;
        this.providerRepository = providerRepository;
        this.documentRepository = documentRepository;
    }

    @PostMapping("/avatar")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        var user = currentUserService.requireUser();
        String path = fileStorageService.store(file, "avatars/" + user.getId());
        String url = "/uploads/files/" + path;
        return Map.of("url", url, "path", path);
    }

    @PostMapping("/document")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    @Transactional
    public DocumentUploadResponse uploadDocument(@RequestParam("file") MultipartFile file,
                                                  @RequestParam("type") String documentType) {
        UserAccount user = currentUserService.requireUser();
        ProviderProfile provider = providerRepository.findByUserId(user.getId())
            .orElseThrow(() -> new EntityNotFoundException("Provider profile not found"));

        String path = fileStorageService.store(file, "documents/" + user.getId());
        String url = "/uploads/files/" + path;

        ProviderDocument doc = documentRepository.save(
            new ProviderDocument(provider, documentType, url));

        return new DocumentUploadResponse(doc.getId(), url, path, documentType, doc.getStatus());
    }

    @GetMapping("/documents/me")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    public List<DocumentUploadResponse> getMyDocuments() {
        UserAccount user = currentUserService.requireUser();
        ProviderProfile provider = providerRepository.findByUserId(user.getId())
            .orElseThrow(() -> new EntityNotFoundException("Provider profile not found"));
        return documentRepository.findByProviderIdOrderByCreatedAtDesc(provider.getId())
            .stream()
            .map(d -> new DocumentUploadResponse(d.getId(), d.getFileUrl(), null,
                d.getDocumentType(), d.getStatus()))
            .toList();
    }

    public record DocumentUploadResponse(Long id, String url, String path,
                                          String type, String status) {}
}
