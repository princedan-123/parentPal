<h1>ParentPal</h1>
<p>ParentPal is a backend portfolio project. It is a web app that helps clients find teachers based on their location. Clients can search for teachers who teach a particular subject, and the app will return a list of teachers sorted based on their proximity to the client's location.</p>
<h3>Installation</h3>
<p>Clone the repository:
git clone  https://github.com/princedan-123/parentPal.git
</p>
<p>
cd parentPal
</p>
<p>
Install dependencies by running:
npm install
</p>
<h3>Usage</h3>
<p>This app uses an external API (TomTom API) for geocoding and matrix searching, so you need to obtain an API key for authentication. You can visit the official website at <a href="https://developer.tomtom.com/documentation">TomTom API Documentation </a> for more information.</p>
<p>The API key, along with other sensitive data, should be stored in a hidden file called .env as environment variables. This file should contain the following environment variables:
<ul>
<li>DB_HOST=localhost</li>
<li>DB_PORT=27017</li>
<li>SERVER_PORT=8080</li>
<li>DB_NAME=parentPal</li>
<li>tomApi_key=<your tomtom api key></li>
</ul>
Start the app by running:
<p>
npm run dev
# or
node app.js
</p>
<p>
Note: The .env file should not be pushed to version control systems like Git as it contains sensitive data. It should be added to .gitignore.
</p>
<p><strong>For more information about the various API endpoints in the project, please refer to the API_documentation directory of this project.</strong> </p>
</p>
<h4>Foot notes<h4>
<p>
contributors: 
Daniel Ebuka Mabia 08087681764 danielebukamabia@gmail.com

Uko uwatt 08067089484
</p>
<p>This is a portfolio project for the ALX Software Engineering Programme developed by Daniel Ebuka Mabia and Uko Uwatt, who are both students of the program. At the time of writing, this project has not been hosted; it is only available on GitHub. The project was chosen to help both students learn and understand the fundamentals of backend programming.
</p>