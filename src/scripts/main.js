const tippy = require("tippy.js").default;

export const customScript = function () {
  console.log("ENGrid client scripts are executing");
  // Add your client scripts here
  let enFieldPhoneNumber = document.querySelectorAll(
    "input#en__field_supporter_phoneNumber"
  )[0];
  if (enFieldPhoneNumber) {
    enFieldPhoneNumber.placeholder = "000-000-0000 (Optional)";
  }

  let enFieldCVV = document.querySelectorAll(
    "input#en__field_transaction_ccvv"
  )[0];
  if (enFieldCVV) {
    enFieldCVV.placeholder = "3 Digits";
  }

  // Add "Why is this required?" markup to the Title field
  // Only show it if the Title field is marked as required
  let titleLabel = document.querySelectorAll(
    ".en__field--title.en__mandatory > label"
  )[0];
  if (titleLabel) {
    let el = document.createElement("span");
    let childEl = document.createElement("a");
    childEl.href = "#";
    childEl.id = "title-tooltip";
    childEl.className = "label-tooltip";
    childEl.tabIndex = "-1";
    childEl.innerText = "Why is this required?";
    childEl.addEventListener("click", (e) => e.preventDefault());
    el.appendChild(childEl);
    titleLabel.appendChild(el);
    tippy("#title-tooltip", {
      content:
        "The U.S. Senate is now requiring that all letters include one of the following titles: Mr., Mrs., Miss, Ms., Dr. We understand that not everyone identifies with one of these titles, and we have provided additional options. However, in order to ensure that your action lands in the inbox of your Senator, you may need to select one of these options.",
    });
  }

  // Add "what's this" markup to the CVV field
  let ccvvLabel = document.querySelectorAll(".en__field--ccvv > label")[0];
  if (ccvvLabel) {
    let el = document.createElement("span");
    let childEl = document.createElement("a");
    childEl.href = "#";
    childEl.id = "ccv-tooltip";
    childEl.className = "label-tooltip";
    childEl.tabIndex = "-1";
    childEl.innerText = "What's this?";
    childEl.addEventListener("click", (e) => e.preventDefault());
    el.appendChild(childEl);
    ccvvLabel.appendChild(el);
    tippy("#ccv-tooltip", {
      content:
        "The three or four digit security code on your debit or credit card",
    });
  }
};
