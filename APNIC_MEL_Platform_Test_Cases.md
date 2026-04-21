# APNIC MEL Platform – Module-wise Test Cases

**Document Source:** [APNIC MEL Platform SRS](https://docs.google.com/document/d/1UoHyltYI4VnC39lWhBLeqhpJ7NH2TXBNlJe_vy6VCAI/edit?usp=sharing)  
**Version:** 1.0  
**Prepared by:** Senior QA Engineer / Test Analyst

---

## Module 1: Authentication

### 1.1 Positive Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| AUTH_TC_001 | Authentication | Positive | Admin login with valid credentials | Email: admin@apnic.net, Password: ValidPassword123 | 1. Navigate to Login Screen<br>2. Enter valid admin email<br>3. Enter valid password<br>4. Click Login | User is authenticated and redirected to Admin Dashboard | |
| AUTH_TC_002 | Authentication | Positive | Project Lead login with valid credentials | Email: lead@apnic.net, Password: ValidPassword123 | 1. Navigate to Login Screen<br>2. Enter valid project lead email<br>3. Enter valid password<br>4. Click Login | User is authenticated and redirected to Project Lead Dashboard | |
| AUTH_TC_003 | Authentication | Positive | Forgot Password – valid email | Email: user@apnic.net | 1. Navigate to Login Screen<br>2. Click Forgot Password<br>3. Enter registered email<br>4. Submit | Password reset email is sent; success message displayed | |
| AUTH_TC_004 | Authentication | Positive | Email Invitation Acceptance | Invitation link with valid token | 1. Open invitation email<br>2. Click acceptance link<br>3. Set new password<br>4. Submit | User account is activated; user can login | |
| AUTH_TC_005 | Authentication | Positive | Logout functionality | Logged-in Admin user | 1. Login as Admin<br>2. Click Logout | User is logged out and redirected to Login Screen | |

### 1.2 Negative Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| AUTH_TC_006 | Authentication | Negative | Login with invalid credentials | Email: admin@apnic.net, Password: WrongPass | 1. Navigate to Login Screen<br>2. Enter valid email but wrong password<br>3. Click Login | Error message displayed; user remains on Login Screen | |
| AUTH_TC_007 | Authentication | Negative | Login with non-existent email | Email: nonexistent@apnic.net | 1. Navigate to Login Screen<br>2. Enter unregistered email<br>3. Enter any password<br>4. Click Login | Error message displayed; login denied | |
| AUTH_TC_008 | Authentication | Negative | Login with empty credentials | Email: (blank), Password: (blank) | 1. Navigate to Login Screen<br>2. Leave email and password empty<br>3. Click Login | Validation error; fields highlighted | |
| AUTH_TC_009 | Authentication | Negative | Login with invalid email format | Email: invalid-email | 1. Navigate to Login Screen<br>2. Enter malformed email<br>3. Click Login | Validation error; invalid format message | |
| AUTH_TC_010 | Authentication | Negative | Forgot Password – non-existent email | Email: notregistered@apnic.net | 1. Navigate to Forgot Password<br>2. Enter unregistered email<br>3. Submit | Generic message (no email enumeration); no error leak | |
| AUTH_TC_011 | Authentication | Negative | Expired invitation link | Expired invitation token | 1. Open expired invitation link | Error message; option to request new invitation | |

---

## Module 2: Project Creation (Admin)

### 2.1 Positive Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| PROJ_TC_001 | Project Creation | Positive | Create project with all mandatory fields | Project Name: "Training Project 2025", General Category: "Capacity Building", Specific Category: "Training", Start Date: 01/01/2025, End Date: 31/12/2025, Reporting Interval: Quarterly, 1 Objective, 1 Outcome, 1 Indicator | 1. Login as Admin<br>2. Navigate to Create Project<br>3. Fill all mandatory fields<br>4. Assign Project Lead<br>5. Submit | Project created; assignment email sent to Project Lead | |
| PROJ_TC_002 | Project Creation | Positive | Create project with multiple objectives, outcomes, indicators | 2 Objectives, 2 Outcomes, 3 Indicators | 1. Login as Admin<br>2. Create Project<br>3. Add 2 objectives, 2 outcomes, 3 indicators<br>4. Assign Project Lead<br>5. Submit | Project saved with full structure | |
| PROJ_TC_003 | Project Creation | Positive | Assign existing user as Project Lead | Existing user: lead@apnic.net | 1. Create Project<br>2. Select existing user from dropdown<br>3. Submit | Project Lead assigned; notification sent | |
| PROJ_TC_004 | Project Creation | Positive | Invite new user as Project Lead | Email: newuser@apnic.net | 1. Create Project<br>2. Enter new user email in invite field<br>3. Submit | Invitation sent; user created upon acceptance | |
| PROJ_TC_005 | Project Creation | Positive | Edit project before reporting cycle begins | Project in Draft state | 1. Login as Admin<br>2. Open Project Detail<br>3. Edit project name<br>4. Save | Project updated successfully | |
| PROJ_TC_006 | Project Creation | Positive | Select Monthly reporting interval | Reporting Interval: Monthly | 1. Create Project<br>2. Select Monthly from dropdown<br>3. Submit | Project saved with Monthly interval | |

### 2.2 Negative Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| PROJ_TC_007 | Project Creation | Negative | Create project without Project Lead | All fields except Project Lead | 1. Create Project<br>2. Leave Project Lead unassigned<br>3. Submit | Validation error; Project Lead mandatory | |
| PROJ_TC_008 | Project Creation | Negative | Create project without at least 1 outcome | 1 Objective, 0 Outcomes | 1. Create Project<br>2. Add objective but no outcome<br>3. Submit | Validation error; at least 1 outcome required | |
| PROJ_TC_009 | Project Creation | Negative | Create project without at least 1 indicator per outcome | 1 Outcome, 0 Indicators | 1. Create Project<br>2. Add outcome but no indicator<br>3. Submit | Validation error; at least 1 indicator per outcome | |
| PROJ_TC_010 | Project Creation | Negative | Create project with End Date before Start Date | Start: 31/12/2025, End: 01/01/2025 | 1. Create Project<br>2. Enter invalid date range<br>3. Submit | Validation error; End Date must be after Start Date | |
| PROJ_TC_011 | Project Creation | Negative | Create project with empty Project Name | Project Name: (blank) | 1. Create Project<br>2. Leave Project Name empty<br>3. Submit | Validation error; Project Name required | |
| PROJ_TC_012 | Project Creation | Negative | Edit project after reporting has started | Project with published report | 1. Login as Admin<br>2. Open Project with published report<br>3. Attempt to edit project structure | Edit disabled or blocked; appropriate message | |
| PROJ_TC_013 | Project Creation | Negative | Create project without timeline | Timeline: (blank) | 1. Create Project<br>2. Leave timeline empty<br>3. Submit | Validation error; timeline required | |

---

## Module 3: Reporting (Project Lead)

### 3.1 Positive Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| RPT_TC_001 | Reporting | Positive | View assigned projects list | Project Lead with 2 assigned projects | 1. Login as Project Lead<br>2. Navigate to Dashboard | Assigned projects list displayed | |
| RPT_TC_002 | Reporting | Positive | Enter disaggregated data within reporting window | Current date ≥ (due_date − 10 days), all disaggregation fields | 1. Login as Project Lead<br>2. Select project<br>3. Select Outcome and Indicator<br>4. Enter all required disaggregation fields<br>5. Save | Data saved as Draft | |
| RPT_TC_003 | Reporting | Positive | Publish report when all indicators completed | All indicators filled | 1. Complete all indicator data<br>2. Click Publish | Report published; Admin notified; status = Published | |
| RPT_TC_004 | Reporting | Positive | Report remains in Draft state until all indicators complete | Partial indicator data | 1. Enter data for some indicators only<br>2. Attempt Publish | Publish button disabled; Draft state retained | |
| RPT_TC_005 | Reporting | Positive | Submit disaggregated data with all mandatory fields | Economy, Infrastructure, Institution, Operator, Gender, Age, Sector, ASN, Technology, Disability, Rural/Urban, Topic, Stakeholder Type, Partner Type | 1. Select indicator<br>2. Fill all mandatory disaggregation fields<br>3. Save | Data saved; no validation errors | |
| RPT_TC_006 | Reporting | Positive | Reporting within 10 days before due date | Due date: 10 days from today | 1. Login as Project Lead<br>2. Select project<br>3. Open Reporting Screen | Reporting screen accessible; data entry allowed | |

### 3.2 Negative Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| RPT_TC_007 | Reporting | Negative | Report when outside reporting window | Current date < (due_date − 10 days) | 1. Login as Project Lead<br>2. Select project<br>3. Attempt to edit report | Submission disabled; appropriate message | |
| RPT_TC_008 | Reporting | Negative | Publish with incomplete indicator data | 1 of 3 indicators incomplete | 1. Fill 2 of 3 indicators<br>2. Click Publish | Publish button disabled; validation message | |
| RPT_TC_009 | Reporting | Negative | Save without required disaggregation fields | Missing Economy, Gender | 1. Enter partial disaggregation data<br>2. Save | Validation error; required fields highlighted | |
| RPT_TC_010 | Reporting | Negative | Edit published report without approval | Report status = Published | 1. Login as Project Lead<br>2. Open published report<br>3. Attempt to edit | Edit disabled; option to request edit shown | |
| RPT_TC_011 | Reporting | Negative | Project Lead views non-assigned project | Project Lead not assigned to project | 1. Login as Project Lead<br>2. Attempt to access via URL or navigation | Access denied; project not visible | |
| RPT_TC_012 | Reporting | Negative | Submit after reporting due date | Due date passed | 1. Login as Project Lead<br>2. Attempt to submit report | Submission locked; error message | |
| RPT_TC_013 | Reporting | Negative | Invalid data type in numeric field | ASN: "abc" | 1. Enter non-numeric value in ASN<br>2. Save | Validation error; numeric expected | |

---

## Module 4: Edit Request Workflow

### 4.1 Positive Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| EDIT_TC_001 | Edit Request | Positive | Project Lead submits edit request | Indicator: "Beneficiaries", Reason: "Data miscalculation", Fields: value | 1. Login as Project Lead<br>2. Open published report<br>3. Click Request Edit<br>4. Specify indicator, fields, reason<br>5. Submit | Edit request created; status = Edit Requested | |
| EDIT_TC_002 | Edit Request | Positive | Admin approves edit request | Admin user | 1. Login as Admin<br>2. Open Edit Request Approval Screen<br>3. Approve request | Report unlocked; Project Lead notified | |
| EDIT_TC_003 | Edit Request | Positive | Project Lead edits and re-publishes after approval | Unlocked report | 1. Login as Project Lead<br>2. Open unlocked report<br>3. Edit indicator values<br>4. Re-publish | Report re-published; status = Published; audit log updated | |
| EDIT_TC_004 | Edit Request | Positive | Admin rejects edit request | Admin user | 1. Login as Admin<br>2. Open Edit Request Approval Screen<br>3. Reject request | Report remains locked; Project Lead notified of rejection | |

### 4.2 Negative Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| EDIT_TC_005 | Edit Request | Negative | Submit edit request without reason | Reason: (blank) | 1. Submit edit request<br>2. Leave reason empty | Validation error; reason required | |
| EDIT_TC_006 | Edit Request | Negative | Project Lead edits without re-publishing after approval | Unlocked report, edits made | 1. Edit unlocked report<br>2. Save but do not re-publish | Report remains in Unlocked state; re-publish required | |
| EDIT_TC_007 | Edit Request | Negative | Admin modifies locked report data directly | Published report | 1. Login as Admin<br>2. Open Report Review<br>3. Attempt to edit data directly | Edit not allowed; must use unlock process | |

---

## Module 5: Report Review & Feedback (Admin)

### 5.1 Positive Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| REV_TC_001 | Report Review | Positive | Admin views published report | Published report | 1. Login as Admin<br>2. Navigate to Report Review<br>3. Select project and report | Report displayed with all indicator values, disaggregation breakdown, progress vs target | |
| REV_TC_002 | Report Review | Positive | Admin views audit history | Report with edit history | 1. Open Report Review<br>2. View audit history section | Audit log shows User ID, Timestamp, Old value, New value, Action type | |
| REV_TC_003 | Report Review | Positive | Admin sends feedback to Project Lead | Feedback text: "Good progress" | 1. Open Report Review<br>2. Enter feedback in Feedback Submission Screen<br>3. Submit | Feedback sent; Project Lead can view | |
| REV_TC_004 | Report Review | Positive | Admin views version number | Report with version history | 1. Open Report Review | Version number displayed | |

### 5.2 Negative Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| REV_TC_005 | Report Review | Negative | Project Lead views Report Review screen | Project Lead role | 1. Login as Project Lead<br>2. Attempt to access Report Review screen | Access denied; screen not visible | |

---

## Module 6: Analytics

### 6.1 Positive Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| ANLY_TC_001 | Analytics | Positive | Filter analytics by General Category | General Category: "Capacity Building" | 1. Login as Admin<br>2. Open Analytics Dashboard<br>3. Select General Category filter | Filtered results displayed | |
| ANLY_TC_002 | Analytics | Positive | Filter analytics by date range | Start: 01/01/2025, End: 31/12/2025 | 1. Open Analytics<br>2. Set date range filter<br>3. Apply | Filtered results for date range | |
| ANLY_TC_003 | Analytics | Positive | Filter analytics by Project Lead | Project Lead: lead@apnic.net | 1. Open Analytics<br>2. Select Project Lead filter<br>3. Apply | Filtered results for selected Project Lead | |
| ANLY_TC_004 | Analytics | Positive | Filter analytics by Status | Status: Published | 1. Open Analytics<br>2. Select Status filter<br>3. Apply | Filtered results by status | |
| ANLY_TC_005 | Analytics | Positive | View indicator-level progress | Multiple projects | 1. Open Analytics<br>2. View indicator progress charts | Chart displays indicator-level progress | |
| ANLY_TC_006 | Analytics | Positive | View disaggregated breakdowns | Projects with disaggregation data | 1. Open Analytics<br>2. View disaggregation charts | Disaggregated breakdown displayed | |
| ANLY_TC_007 | Analytics | Positive | View Published vs Draft counts | Multiple projects | 1. Open Analytics | Published and Draft counts displayed | |

### 6.2 Negative Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| ANLY_TC_008 | Analytics | Negative | Project Lead accesses Analytics Dashboard | Project Lead role | 1. Login as Project Lead<br>2. Attempt to access Analytics | Access denied | |
| ANLY_TC_009 | Analytics | Negative | Filter with invalid date range | End date before Start date | 1. Open Analytics<br>2. Set invalid date range<br>3. Apply | Validation error or no results | |

---

## Module 7: Learning Module

### 7.1 Positive Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| LRN_TC_001 | Learning Module | Positive | Learning summary generated on project completion | Project with all reporting cycles completed | 1. Complete final report cycle<br>2. System marks project Completed | Learning summary generated; total beneficiaries, disaggregation totals displayed | |
| LRN_TC_002 | Learning Module | Positive | Admin views Learning Summary | Completed project | 1. Login as Admin<br>2. Open Project Detail<br>3. View Learning Summary | Summary displays total beneficiaries, disaggregation totals, geographic summary, narrative | |
| LRN_TC_003 | Learning Module | Positive | Learning summary shows aggregate disaggregations | Completed project with disaggregated data | 1. Open Learning Summary | Aggregated disaggregation totals displayed | |

### 7.2 Negative Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| LRN_TC_004 | Learning Module | Negative | Learning summary not available for incomplete project | Project with pending reports | 1. Login as Admin<br>2. Open incomplete project | Learning Summary not displayed or disabled | |
| LRN_TC_005 | Learning Module | Negative | Edit data in completed project | Completed project | 1. Attempt to edit report in completed project | Edit not allowed; data locked | |
| LRN_TC_006 | Learning Module | Negative | Project Lead submits new report after completion | Completed project | 1. Login as Project Lead<br>2. Attempt to submit report for completed project | Submission disabled | |

---

## Module 8: User Management

### 8.1 Positive Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| USER_TC_001 | User Management | Positive | Admin creates new user | Email: user@apnic.net, Role: Project Lead | 1. Login as Admin<br>2. Open User Management<br>3. Create user with required fields<br>4. Submit | User created; can be assigned to projects | |
| USER_TC_002 | User Management | Positive | Admin invites user via email | Email: invite@apnic.net | 1. Login as Admin<br>2. Invite user<br>3. Enter email | Invitation sent | |
| USER_TC_003 | User Management | Positive | Admin deactivates user (soft delete) | Active user | 1. Login as Admin<br>2. Open User Management<br>3. Deactivate user | User deactivated; soft delete applied | |
| USER_TC_004 | User Management | Positive | Admin assigns role to user | Role: Project Lead | 1. Open User Management<br>2. Select user<br>3. Assign role | Role assigned | |
| USER_TC_005 | User Management | Positive | Admin resets user password | User: user@apnic.net | 1. Open User Management<br>2. Select user<br>3. Reset password | Password reset initiated; user notified | |

### 8.2 Negative Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| USER_TC_006 | User Management | Negative | Project Lead accesses User Management | Project Lead role | 1. Login as Project Lead<br>2. Attempt to access User Management | Access denied | |
| USER_TC_007 | User Management | Negative | Create user with duplicate email | Email already exists | 1. Create user with existing email | Validation error; duplicate email | |
| USER_TC_008 | User Management | Negative | Create user with invalid email format | Email: invalid | 1. Create user with invalid email | Validation error | |
| USER_TC_009 | User Management | Negative | Deactivate user who is assigned as Project Lead | User with active project | 1. Deactivate user | Appropriate handling (warning or block if business rule) | |

---

## Module 9: Notifications

### 9.1 Positive Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| NOTIF_TC_001 | Notifications | Positive | Assignment email sent on project creation | New project created | 1. Admin creates project and assigns Project Lead | Project Lead receives assignment email | |
| NOTIF_TC_002 | Notifications | Positive | Admin notified on report publish | Project Lead publishes report | 1. Project Lead publishes report | Admin receives publish notification | |
| NOTIF_TC_003 | Notifications | Positive | Project Lead receives edit approval email | Admin approves edit request | 1. Admin approves edit request | Project Lead receives approval email | |
| NOTIF_TC_004 | Notifications | Positive | Project Lead receives edit rejection email | Admin rejects edit request | 1. Admin rejects edit request | Project Lead receives rejection email | |
| NOTIF_TC_005 | Notifications | Positive | Reporting reminder emails sent before deadline | Project with upcoming due date | 1. Wait for reminder trigger (e.g., 2 days before due) | Project Lead receives reminder email | |

### 9.2 Negative Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| NOTIF_TC_006 | Notifications | Negative | Failed email delivery – retry mechanism | Invalid email or mail server down | 1. Trigger notification with invalid recipient | Retry mechanism attempts delivery; failure logged | |
| NOTIF_TC_007 | Notifications | Negative | Notification failure logging | Simulated email failure | 1. Cause email delivery failure | Failure logged in system | |

---

## Module 10: Audit Log

### 10.1 Positive Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| AUDIT_TC_001 | Audit Log | Positive | Admin views audit log | Report with edit history | 1. Login as Admin<br>2. Open Audit Log Viewer | Audit log displays entity_type, entity_id, action_type, old_value, new_value, user_id, timestamp | |
| AUDIT_TC_002 | Audit Log | Positive | Audit log captures report edit | Project Lead edits and re-publishes | 1. Edit unlocked report<br>2. Re-publish | Audit log entry created with old_value, new_value, user_id, timestamp | |
| AUDIT_TC_003 | Audit Log | Positive | Audit log captures project creation | New project created | 1. Admin creates project | Audit log entry created | |

### 10.2 Negative Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| AUDIT_TC_004 | Audit Log | Negative | Project Lead accesses Audit Log | Project Lead role | 1. Login as Project Lead<br>2. Attempt to access Audit Log | Access denied | |
| AUDIT_TC_005 | Audit Log | Negative | Admin cannot bypass audit log | Any data modification | 1. Verify all modifications | All changes logged; no bypass possible | |

---

## Module 11: Project Completion & Data Locking

### 11.1 Positive Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| COMP_TC_001 | Project Completion | Positive | Project marked Completed when all cycles done | 4 quarterly reports for 1-year project | 1. Publish final report cycle | Project status = Completed; data locked | |
| COMP_TC_002 | Project Completion | Positive | Data locked after completion | Completed project | 1. Attempt to edit report | Edit not allowed |

### 11.2 Negative Test Cases

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| COMP_TC_003 | Project Completion | Negative | Project not marked Completed with pending cycles | 3 of 4 quarters reported | 1. View project status | Project not Completed; status reflects pending | |
| COMP_TC_004 | Project Completion | Negative | Hard delete attempt on report | Admin user | 1. Attempt to hard delete report | Hard delete not allowed; soft delete only | |

---

## Module 12: Non-Functional Requirements

### 12.1 Performance

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| NFR_TC_001 | Performance | Positive | Page load time < 3 seconds | Admin Dashboard | 1. Login as Admin<br>2. Measure time to Dashboard load | Page loads within 3 seconds | |
| NFR_TC_002 | Performance | Positive | Concurrent users supported | 10+ simultaneous users | 1. Simulate 10+ concurrent logins and actions | System responds without degradation | |

### 12.2 Security

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| NFR_TC_003 | Security | Positive | Role-based access control enforced | Project Lead role | 1. Attempt Admin-only actions as Project Lead | Access denied | |
| NFR_TC_004 | Security | Positive | Field-level permissions respected | Project Lead editing report | 1. Attempt to modify indicator definitions | Modification blocked | |
| NFR_TC_005 | Security | Positive | Encrypted storage | Sensitive data | 1. Verify data at rest | Data encrypted | |

### 12.3 Scalability

| Test ID | Module Name | Test Case Type | Test Description | Test Data | Test Steps | Expected Result | Actual Result |
|---------|-------------|----------------|-------------------|-----------|------------|-----------------|---------------|
| NFR_TC_006 | Scalability | Positive | Multiple projects supported | 50+ projects | 1. Create and manage 50+ projects | System operates normally | |

---

## Assumptions / Clarifications Needed

| # | Assumption / Clarification | Module |
|---|----------------------------|--------|
| 1 | **Program Lead vs Project Lead:** Document mentions both. Clarify if Program Lead is a separate role with distinct permissions (e.g., portfolio-level view). | Project Creation, Roles |
| 2 | **Project Support:** Create Project screen lists "Project Support" – is this a separate user/role or a text field? | Project Creation |
| 3 | **Number of Expected Users:** Purpose and validation rules unclear. | Project Creation |
| 4 | **Admin override for submission after due date:** Document mentions "unless Admin overrides" – need UI flow and permission rules. | Reporting |
| 5 | **Disaggregation dropdown options:** Exact values for Economy, Infrastructure, Gender, Age, Sector, Disability, Rural/Urban, Stakeholder Type not specified. | Reporting |
| 6 | **AI Chatbot / AI analysis:** Document mentions "future phase" – exclude from current test scope unless confirmed. | Learning Module |
| 7 | **Reporting reminder emails:** Exact trigger (e.g., 2 days, 5 days before due) not specified. | Notifications |
| 8 | **Role & Permission Management (optional advanced):** Screen 15 marked optional – confirm if in scope. | User Management |
| 9 | **Archive project (soft delete):** Flow and impact on reports/analytics not fully detailed. | Project Management |
| 10 | **Version control:** Re-publish increments version – confirm if version history is viewable in UI. | Report Review |

---

## Summary

| Module | Positive Test Cases | Negative Test Cases | Total |
|--------|---------------------|---------------------|-------|
| Authentication | 5 | 6 | 11 |
| Project Creation | 6 | 7 | 13 |
| Reporting | 6 | 7 | 13 |
| Edit Request | 4 | 3 | 7 |
| Report Review | 4 | 1 | 5 |
| Analytics | 7 | 2 | 9 |
| Learning Module | 3 | 3 | 6 |
| User Management | 5 | 4 | 9 |
| Notifications | 5 | 2 | 7 |
| Audit Log | 3 | 2 | 5 |
| Project Completion | 2 | 2 | 4 |
| Non-Functional | 6 | 0 | 6 |
| **Total** | **56** | **39** | **95** |

---

*This document can be copied into Excel or Google Sheets. Use tab-separated or comma-separated export for table import.*
