var months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Handle the custom token passed from Flamelink in the URL
 */
function getAuthTokenFromURL() {
  var urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("fbAuthToken");
}

/**
 * Generate and append the relevant HTML for the report
 */
function displayReport(numberOfSales, salesByMonth) {
  document.body.innerHTML = `<table id="salesReport">
    <thead>
      <tr>
        <th>Month</th>
        <th>Total Sales</th>
        <th>Total Items Sold</th>
        <th>Total Value</th>
      </tr>
    </thead>
    <tbody id="salesReportBody">
      <tr>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
      <th align="right" colspan="4">
       Total Sales: ${numberOfSales}
      </th>
      </tr>
    </tfoot>
  </table>`;

  document.querySelector("#salesReportBody").innerHTML = Object.keys(
    salesByMonth
  )
    .map(function (month) {
      return `<tr>
        <td>${month}</td>
        <td align="right">${salesByMonth[month].totalSales}</td>
        <td align="right">${salesByMonth[month].totalItemsSold}</td>
        <td align="right">$ ${salesByMonth[month].totalValue}</td>
      </tr>`;
    })
    .join("");
}

/**
 * Query the "sales" collection and format
 * the data to use it for the report
 */
function getSalesReportData() {
  var orderData = {};
  firebase
    .firestore()
    .collection("sales")
    .orderBy("date")
    .get()
    .then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        var docData = doc.data();
        var orderMonth = months[docData.date.toDate().getMonth()]; // returns 0-11
        var currentDataForMonth = orderData[orderMonth] || {
          totalSales: 0,
          totalItemsSold: 0,
          totalValue: 0,
        };

        currentDataForMonth = {
          totalSales: currentDataForMonth.totalSales + 1,
          totalItemsSold:
            currentDataForMonth.totalItemsSold + docData.lineItems,
          totalValue: currentDataForMonth.totalValue + docData.orderTotal,
        };

        orderData[orderMonth] = currentDataForMonth;
      });

      displayReport(querySnapshot.size, orderData);
    });
}

/**
 * Once the document contents has loaded, check if the user is signed in
 * alternatively try to sign them in using a custom token
 */
document.addEventListener("DOMContentLoaded", function () {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      document.body.innerHTML =
        "<span>Login successful, fetching report...</span>";

      try {
        getSalesReportData();
      } catch (e) {
        console.error(e);
        document.body.innerHTML =
          "<span>There was a problem generating your report</span>";
      }
    } else {
      try {
        firebase.auth().signInWithCustomToken(getAuthTokenFromURL());
      } catch (e) {
        console.error(e);
        document.body.innerHTML = "<span>Unable to login</span>";
      }
    }
  });
});
