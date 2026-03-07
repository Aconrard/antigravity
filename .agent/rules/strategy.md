---
trigger: always_on
---

# SMC Project

## Business Requirements

* A web application that generates CoAEMSP Student Minimum Competency (SMC) reports for paramedic students  
* The app connects to JotForm API to pull student clinical competency data from a Single Program Form (Form ID: 260143571114951)  
* Data is cleaned, transformed, and aggregated to track student progress against 35 required competency categories  
* The app presents a student selection interface allowing the user to choose an individual student for report generation  
* The generated report displays each competency category, the student's current count, the required minimum, completion status, and where applicable, success rate  
* Success tracking is required for Intravenous (IV) and Orotracheal Intubation procedures, showing attempted count, successful count, and percent success  
* Age categorization of patient encounters must follow these rules:  
  - Newborn: 0 years, 0 months  
  - Infant: 0 years, 1-12 months  
  - Toddler: 1-2 years or 13-35 months  
  - Preschool: 3-5 years  
  - Preadolescent: 6-12 years  
  - Adolescent: 13-18 years  
  - Adult: 19-65 years  
  - Geriatric: over 65 years  
  - Pediatric: 18 years and under (aggregate)  
* Patient encounter is defined as a record where both patient history interview AND patient exam were performed  
* The report must include rotation site breakdown (Clinical Site-Hospital/Clinic, Ambulance Rotation, Simulation)  
* The report must include age group distribution by rotation site (Pediatric vs Adult)  
* The report must include a Cohen/CCMC pediatric patient count for clinical site encounters  
* Optional date range filtering (start date, end date) must be supported  
* Instructor authentication is required before generating reports, validated against an authorized credentials list  
* The generated report must be printable directly from the browser or downloadable as a PDF file  
* The app should display processing progress and status messages during report generation  
* No persistence layer is required for the MVP; data is pulled fresh from JotForm API on each report generation

## Technical Details

* Implemented as a modern NextJS app, client rendered  
* The NextJS app should be created in a subdirectory called frontend  
* No database or persistence layer; all data is pulled fresh from JotForm API per request  
* No user management beyond the hardcoded instructor authentication check  
* Use popular, well-maintained libraries

### API Configuration  
* JotForm API Key: 00a936f3d1e1ad6f9b7185453a1cb4e6  
* JotForm Form ID: 260143571114951  
* Base URL: https://api.jotform.com/form/{FORM_ID}/submissions  
* API requests must be batched in groups of 750 submissions with 0.5 second delay between batches to avoid rate limiting  
* Submissions are ordered by created_at

### Authorized Instructor Credentials  
* Credentials are hardcoded key-value pairs (Universal ID to Employee Number):  
  - krummel: 103293  
  - cgerke: 101631  
  - aguerne: 102755  
  - sorlando: 188217  
  - ewaldron: 104588  
  - aconrard: 105823

### Data Processing Pipeline  
1. Pull all submissions from JotForm API in batches  
2. Extract and flatten submission data from nested JSON structure  
3. Remove empty columns (all null/NaN values)  
4. Apply optional date range filtering on created_at field (mm-dd-yyyy format)  
5. Extract course number from paramedicProgram405 field (strip # prefix, parse integer)  
6. Rename API field names to processing names using defined column mapping  
7. Extract student names from paramedicStudent405 field  
8. Convert patient age fields (years and months) to numeric values  
9. Create patient encounter flag (performed_interview = Yes AND performed_exam = Yes)  
10. Apply age categorization (detailed and simple Pediatric/Adult)  
11. Aggregate all competency categories by student  
12. Apply completion status checks against minimum requirements  
13. Generate report output

### Field Exclusion Patterns  
* Exclude fields matching these patterns: input, divider, pageBreak, submit, calculation  
* Exclude exact field names: submit, calculation, formSubmission

### Column Mapping (API Name to Processing Name)  
* experienceSite -> rotation_site  
* patientHistoryPerformed -> performed_interview  
* patientExamPerformed -> performed_exam  
* patientAgeYear/patientAgeYears -> patient_age_yrs  
* PatientAgeMonth/patientAgeMonths -> patient_age_months  
* performedAirway -> procedure_performed_airway  
* procedureAirway -> airway_procedure  
* AirwaySuccessful -> airway_procedure_attempt  
* PerformedTwelveLead -> performed_12_lead  
* InterpretedTwelveLead -> interpreted_12_lead  
* rhythmInterpreted -> ecg_interpreted  
* PerformedCardiacProcedures -> procedure_performed_cardiac  
* CardiacProcedures -> cardiac_procedure  
* VenousPerformed -> venous_access  
* VenousProcedure -> venous_procedure  
* VenousAttempts -> venous_attempts  
* VenousSuccess -> attempt_successful  
* MedicationPerformed -> treatment_medication_performed  
* routeAdministered -> administered_through  
* primaryImpression -> Primary_Impression  
* secondaryImpression -> Secondary_Impression  
* patientComplaint -> Patient Complaint  
* studentEmail -> Student E-mail  
* created_at -> Submission Date

### Student Minimum Competency Requirements  
* Newborn: 2  
* Infant: 2  
* Toddler: 2  
* Preschool: 2  
* Preadolescent: 2  
* Adolescent: 2  
* Pediatric: 40  
* Adult: 60  
* Geriatric: 18  
* Intravenous (IV): 27 (success tracking required, 27 successful)  
* Intraosseous (IO): 6  
* IV/IO Bolus (IVB): 12  
* IV Drip (IVD): 4  
* Intramuscular (IM): 4  
* Manual Ventilation (PPV w/BVM): 14  
* Orotracheal Intubation: 12 (success tracking required, 12 successful)  
* Endotracheal Suctioning: 4  
* Foreign Body Removal (Magill Forceps): 4  
* Cricothyrotomy: 4  
* Supraglottic Airway: 12  
* Needle Decompression/Thoracotomy: 4  
* Synchronized Cardioversion: 4  
* Defibrillation: 4  
* Transcutaneous Pacing: 4  
* Chest Compressions: 4  
* Rhythms Interpreted (No RSR): 16  
* Cardiac Arrest Patients: 5  
* Trauma Patients: 27  
* Psych/Behavioral Patients: 18  
* Obstetrical Patients: 6  
* Distressed Neonate Patients: 4  
* Cardiac Patients: 18  
* Neuro Patients: 12  
* Respiratory Patients: 12  
* Other Patients: 18

### Patient Type Classification Lists  
* Trauma: Trauma-Abdominal, Trauma-Chest, Trauma-Extremities, Trauma-Head, Trauma-Multisystem, Trauma-Neck/Back, Trauma-Unspecified  
* Psychiatric/Behavioral: Mental Health/Psychiatric, Behavioral/Psychiatric  
* Obstetrical: Any impression containing "OB-"  
* Cardiac: Cardiac-Acute Coronary Syndrome, Cardiac-Other, Chest Pain, Palpitations  
* Neurological: Altered Mental Status, Syncope/Fainting, Neuro-Seizure, Neuro-Stroke/CVA, Neuro-TIA, Neuro-Other, AMS, Change in Responsiveness, Dizziness, Weakness, Headache/Blurred Vision  
* Respiratory: Smoke Inhalation, Respiratory Emergency, Choking, Breathing Problem  
* Cardiac Arrest: Cardiac-Arrest (from Primary or Secondary Impression)  
* Distressed Neonate: patient_age_yrs = 0 AND patient_age_months = 0  
* Other: Abdominal Pain/Problems, Allergic Reaction/Anaphylaxis, Burns, Diabetic Emergency, Electrocution, GI Bleed, Healthy Screening/Physical, Hypovolemic/Shock, ObviousDeath, Overdose/Poisoning, Sepsis/Infection, Stings/Envenomation, Other-Not Specified, Bleeding, Device/Equipment Problem, Fever, Malaise, Pain, Rash/Itching, Abdominal Pain, Diarrhea, Drainage/Discharge, Mass/Lesion, Nausea/Vomitin, Wound

### Data Transformation Rules  
* VenousPerformed field value "Intravenous (IV) with Blood Draw" maps to "Intravenous (IV)"  
* routeAdministered field value "IV Bolus (IVB)" maps to "IV/IO Bolus (IVB)"  
* routeAdministered field value "Piggyback" maps to "IV Drip (IVD)"  
* Dysrhythmia counting excludes "Regular Sinus Rhythm" and "Lab Session" rotation site  
* Cardiac arrest, psychiatric, obstetrical, cardiac, neurological, respiratory, and other patient counts exclude Bioskills/Operating Room rotation site

### Report Output Sections  
* SMC Output: Full competency tracking with counts, minimums, successful attempts, percent success, and completion status per student per category  
* Rotation Site Output: Patient encounter counts by rotation site per student  
* Adult Pediatric Output: Pediatric vs Adult patient counts by rotation site per student  
* Age by Site: Detailed age group breakdown by rotation site per student  
* Cohen CCMC Pediatric: Pediatric patient count from Cohen/CCMC clinical site locations per student  
* SMC Pivot Output: Wide-format pivot table with all categories as columns

### PDF/Print Output  
* The student report must be renderable as a printable page from the browser  
* The report must be downloadable as a PDF file  
* The report layout should be clean, professional, and suitable for accreditation documentation

## Color Scheme

The application uses a Viridis-inspired color palette, providing a professional, accessible, and visually distinct appearance suitable for accreditation documentation.

* Dark Indigo: `#440154` - main headings, header backgrounds, primary navigation  
* Deep Purple: `#31688e` - submit buttons, important actions, active states  
* Teal Blue: `#26828e` - links, key sections, interactive elements  
* Green Accent: `#35b779` - success indicators, completed status, confirmation messages  
* Yellow Highlight: `#fde725` - accent lines, highlights, warnings, progress indicators  
* Dark Background: `#1e1e2e` - console output area, dark mode panels  
* Light Gray: `#f5f5f5` - page background, card backgrounds  
* Gray Text: `#888888` - supporting text, labels, secondary information  
* Error Red: `#d32f2f` - error messages, not completed status indicators  
* White: `#ffffff` - card surfaces, text on dark backgrounds

## Strategy

1. Write a detailed plan with success criteria for each phase to be checked off. Include project scaffolding, `.gitignore`, and rigorous unit testing.

2. Phase 1 - Project Setup and Scaffolding  
   - Initialize NextJS app in frontend subdirectory  
   - Configure project structure with components, hooks, utils, and types directories  
   - Set up `.gitignore` for NextJS, node_modules, .env, and build artifacts  
   - Install dependencies: React, NextJS, a drag-and-drop library, a PDF generation library, and a CSS framework or component library  
   - Create TypeScript type definitions for all data structures (submissions, students, competency categories, report data)  
   - Success criteria: project builds and runs with no errors, all dependencies installed, folder structure in place

3. Phase 2 - API Integration and Data Retrieval  
   - Implement JotForm API client with batched fetching (750 per batch, 0.5s delay)  
   - Implement submission data extraction and flattening from nested JSON  
   - Implement field exclusion filtering (patterns and exact matches)  
   - Implement date parsing for JotForm date formats (string and dictionary)  
   - Implement blank answer detection (null, empty, question text matching)  
   - Write unit tests for API client, data extraction, field exclusion, date parsing, and blank detection  
   - Success criteria: all submissions are retrieved, flattened correctly, and empty/excluded fields are removed; all unit tests pass

4. Phase 3 - Data Processing and Transformation  
   - Implement empty column removal  
   - Implement date range filtering on created_at field  
   - Implement course number extraction from paramedicProgram405 field  
   - Implement column renaming using the defined column mapping  
   - Implement student name extraction from paramedicStudent405 field  
   - Implement patient age conversion to numeric values  
   - Implement patient encounter flag creation (interview AND exam performed)  
   - Implement data transformation rules (IV with Blood Draw mapping, medication route mapping)  
   - Write unit tests for each transformation function  
   