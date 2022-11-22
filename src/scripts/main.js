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
    childEl.innerHTML =
      "<span class='tooltip-long'>Why is this required</span><span class='tooltip-short'>?</span>";
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

  const userIP = () => {
    const ret = fetch(`https://${window.location.hostname}/cdn-cgi/trace`)
      .then((res) => res.text())
      .then((t) => {
        let data = t.replace(/[\r\n]+/g, '","').replace(/\=+/g, '":"');
        data = '{"' + data.slice(0, data.lastIndexOf('","')) + '"}';
        const jsondata = JSON.parse(data);
        return jsondata.ip;
      });
    return ret;
  };

  userIP().then((ip) => {
    window.dataLayer.push({
      userIP: ip,
    });
    console.log(ip);
    window.dataLayer.push({ event: "hasUserIP" });
  });

  // Digital Wallets Moving Parts

  const digitalWalletWrapper = document.querySelector(
    ".merge-with-give-by-select #en__digitalWallet"
  );
  const digitalWalletFirstChild = document.querySelector("#en__digitalWallet");
  const giveBySelect = document.querySelector(".give-by-select");
  if (digitalWalletWrapper && giveBySelect) {
    giveBySelect.appendChild(digitalWalletWrapper);
    digitalWalletFirstChild.insertAdjacentHTML(
      "beforeend",
      "<div class='digital-divider recurring-frequency-y-hide'><span class='divider-left'></span><p class='divider-center'>or enter manually</p><span class='divider-right'></span></div>"
    );
  }

  let digitalWalletsExist;

  setTimeout(function () {
    digitalWalletsExist = document.querySelectorAll(
      ".en__digitalWallet__container > *"
    );
    if (digitalWalletsExist.length > 0) {
      giveBySelect.setAttribute("show-wallets", "");
    }
  }, 500);

  setTimeout(function () {
    digitalWalletsExist = document.querySelectorAll(
      ".en__digitalWallet__container > *"
    );
    if (digitalWalletsExist.length > 0) {
      giveBySelect.setAttribute("show-wallets", "");
    }
  }, 2500);
};
