\## Architecture Decision Records (ADR)



\### ADR-001: Web Application



\*\*Status:\*\* Accepted  



\*\*Context:\*\*  

It was agreed that the solution should be delivered as a web-based application.



\*\*Decision:\*\*  

The system will be implemented as a web application.



\*\*Rationale:\*\*  

\- No installation required  

\- Easy browser access  

\- Suitable for collaborative, team-based estimation sessions  



---



\### ADR-002: Jira Integration



\*\*Status:\*\* Accepted  



\*\*Context:\*\*  

The team uses Jira for sprint planning and task management.



\*\*Decision:\*\*  

The application will integrate with Jira Cloud using REST API v3.



\*\*Rationale:\*\*  

\- Automatic synchronization of story points  

\- Alignment with the existing workflow  

\- Elimination of manual data entry  

\- Improved process consistency  



---



\### ADR-003: Frontend Technology



\*\*Status:\*\* Draft  



\*\*Context:\*\*  

A frontend technology must be selected to implement the user interface.



\*\*Decision:\*\*  

React is proposed as the frontend framework, with Bootstrap used for UI styling and layout.



\*\*Rationale:\*\*  

\- Component-based architecture  

\- Well-suited for dynamic and interactive interfaces  

\- Efficient handling of real-time UI updates  

\- Rapid development of responsive layouts with Bootstrap  

\- Reduced custom CSS effort during the MVP phase  



\### ADR-004: Backend Technology



\*\*Status:\*\* Draft  



\*\*Context:\*\*  

A backend layer is required to securely communicate with the Jira REST API and manage voting logic.



\*\*Decision:\*\*  

Node.js is proposed as the backend technology.



\*\*Rationale:\*\*  

\- Alignment with JavaScript-based frontend (React)  

\- Faster MVP implementation  

\- Lightweight and efficient for REST API communication  

\- Strong support for real-time communication (e.g., WebSocket)  



\*\*Note:\*\*  

The final backend technology should align with the team’s existing infrastructure and standards.

