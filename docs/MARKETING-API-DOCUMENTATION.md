# Rocketry Box Marketing Pages Documentation

## Overview

The Rocketry Box marketing section consists of static, informational pages designed to showcase the platform's features, services, and benefits to potential customers and partners. These pages are built with React and are located in `src/pages/marketing/`.

---

## Structure

- **Home:**  
  Hero section, business benefits, testimonials, company highlights.

- **Features:**  
  Detailed list of platform features (affordable shipping, rate calculator, etc.).

- **Services:**  
  Overview of logistics services (Hyperlocal, B2C, B2B, Air, Fulfillment & Warehousing).

- **Contact:**  
  Contact form for user inquiries (currently logs to console; can be connected to backend).

- **Other Pages:**  
  FAQs, Pricing, Support, Terms, Privacy, Partner information.

---

## How to Update Marketing Pages

- All marketing pages are React components under `src/pages/marketing/`.
- Each page may have a `components/` subfolder for reusable UI blocks.
- To update content, edit the relevant `.tsx` files.
- To add a new marketing page, create a new folder and `index.tsx` under `src/pages/marketing/`, and add a route in your main router.

---

## Contact Form

- The contact form is in `src/pages/marketing/contact/components/contact-form.tsx`.
- By default, it only logs submissions to the console.
- To connect it to a backend or email service, update the `onSubmit` handler.

---

## Become a Partner

- The "Become a Partner" page is in `src/pages/marketing/partner/join.tsx`.
- It includes a form for potential partners to submit their details.
- Currently, the form submission is handled locally (logs to console).
- To integrate with a backend, update the `handleSubmit` function to send data to an API endpoint.

---

## Tracking Page

- The tracking page is in `src/pages/marketing/track/index.tsx`.
- It is currently a static page with no backend integration.
- If you plan to add real-time tracking functionality, you will need to integrate with a backend API.

---

## Design & UX

- Uses Tailwind CSS for styling.
- Animations are handled with Framer Motion.
- UI components are imported from the shared `@/components/ui/` directory.

---

## Example: Adding a New Feature

1. Create a new component in the relevant `components/` folder.
2. Import and use it in the page's `index.tsx`.
3. Update any navigation or links as needed.

---

## (Optional) Backend/API Integration

If you plan to add backend features (e.g., saving contact form submissions), document the API endpoints and expected request/response formats here.

## Backend API Requirements

### Contact Us

- **Endpoint:** `POST /api/v1/marketing/contact`
- **Request Body:**
  ```json
  {
    "email": "string",
    "message": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Message sent successfully"
  }
  ```

### Become a Partner

- **Endpoint:** `POST /api/v1/marketing/partner`
- **Request Body:**
  ```json
  {
    "fullName": "string",
    "companyName": "string",
    "email": "string",
    "contact": "string",
    "address": "string",
    "service": "string",
    "business": "string",
    "timeframe": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Partner registration successful"
  }
  ```

### Tracking Page

- **Endpoint:** `GET /api/v1/marketing/track`
- **Query Parameters:**
  - `trackingId`: string (required)
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "status": "string",
      "location": "string",
      "estimatedDelivery": "string"
    }
}
```