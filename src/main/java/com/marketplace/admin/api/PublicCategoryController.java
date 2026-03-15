package com.marketplace.admin.api;

import com.marketplace.admin.domain.Category;
import com.marketplace.admin.domain.CategoryRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicCategoryController {

    private final CategoryRepository categoryRepository;

    public PublicCategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping("/categories")
    public List<CategoryDto> getActiveCategories() {
        return categoryRepository.findByActiveTrueOrderByDisplayOrderAsc()
            .stream()
            .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug(), c.getIcon(), c.getDisplayOrder()))
            .toList();
    }

    public record CategoryDto(Long id, String name, String slug, String icon, int displayOrder) {}
}
