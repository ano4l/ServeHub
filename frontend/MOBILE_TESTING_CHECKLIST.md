# Mobile Responsiveness Testing Checklist

## Viewport & Layout Tests
- [ ] Test on devices: 320px (iPhone SE), 375px (iPhone 12), 414px (iPhone 12 Pro Max)
- [ ] Test on tablets: 768px (iPad mini), 1024px (iPad Pro)
- [ ] Test on ultra-wide screens: 1440px+
- [ ] Verify no horizontal overflow on any screen size
- [ ] Check safe area handling on notched devices

## Touch Targets & Interactions
- [ ] All buttons meet 44px minimum touch target size
- [ ] Links and interactive elements have adequate spacing
- [ ] Touch feedback (active states) is visible
- [ ] No hover-only interactions on mobile
- [ ] Swipe gestures work correctly

## Typography & Readability
- [ ] Text is readable without zooming on mobile
- [ ] Font sizes scale appropriately on different screens
- [ ] Line height is adequate for mobile reading
- [ ] Text contrast meets WCAG AA standards
- [ ] No text truncation issues

## Navigation & Layout
- [ ] Bottom navigation is accessible with safe areas
- [ ] Navigation items are properly sized for touch
- [ ] Layout shifts don't occur during load
- [ ] Content reflows properly on orientation change
- [ ] Sticky elements don't obscure content

## Forms & Input
- [ ] Input fields are large enough for touch
- [ ] Virtual keyboard doesn't obscure important content
- [ ] Form validation messages are visible
- [ ] Select dropdowns work on touch devices
- [ ] Date/time pickers are mobile-friendly

## Performance & Edge Cases
- [ ] Page loads quickly on mobile networks
- [ ] Images are optimized for mobile
- [ ] No layout shifts during loading
- [ ] Reduced motion preferences are respected
- [ ] App works in landscape orientation

## Accessibility
- [ ] Screen reader compatibility
- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] ARIA labels are present
- [ ] Color contrast meets standards

## Device-Specific Tests
- [ ] iOS Safari compatibility
- [ ] Chrome on Android compatibility
- [ ] Samsung Internet browser compatibility
- [ ] Notch/hole-punch handling
- [ ] Dynamic Island support (iOS)

## Common Mobile Issues to Check
1. **Viewport Zoom**: Ensure user-scalable=no doesn't prevent accessibility zoom
2. **Fixed Positioning**: Check fixed elements don't overlap content
3. **100vh Issues**: Test height units on mobile browsers
4. **Input Focus**: Ensure keyboard doesn't hide inputs
5. **Pull-to-Refresh**: Test if it interferes with scroll
6. **Double-tap Zoom**: Ensure it's handled gracefully
7. **Safe Areas**: Test on devices with notches
8. **Orientation Changes**: Test layout stability

## Testing Tools
- Chrome DevTools Device Mode
- BrowserStack for real device testing
- Responsive design checker tools
- Accessibility testing tools
- Performance testing on mobile networks

## Critical Mobile Breakpoints
- **320px**: Extra small phones (iPhone SE)
- **375px**: Standard phones (iPhone 12)
- **414px**: Large phones (iPhone 12 Pro Max)
- **768px**: Tablets (iPad mini)
- **1024px**: Large tablets (iPad Pro)
- **1440px**: Desktop and beyond

## Performance Targets
- **First Contentful Paint**: < 1.5s on 3G
- **Largest Contentful Paint**: < 2.5s on 3G
- **Time to Interactive**: < 3.8s on 3G
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
