const tippy = require("tippy.js").default;

export const customScript = function (App, EnForm) {
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

  //On form block with .us-only and a country field, add a notice, set value to US and disable field
  if (
    document.querySelector(
      ".en__component--formblock.us-only .en__field--country"
    )
  ) {
    if (!document.querySelector(".en__field--country .en__field__notice")) {
      App.addHtml(
        '<div class="en__field__notice"><em>Note: This action is limited to US addresses.</em></div>',
        ".us-only .en__field--country .en__field__element",
        "after"
      );
    }
    const countrySelect = App.getField("supporter.country");
    countrySelect.setAttribute("disabled", "disabled");
    App.setFieldValue("supporter.country", "US");
    App.createHiddenInput("supporter.country", "US");
    countrySelect.addEventListener("change", () => {
      countrySelect.value = "US";
    });
  }

  function addTooltip(labelElement, fieldName, labelText, tooltipText) {
    if (!labelElement) {
      return;
    }
    let link = document.createElement("a");
    link.href = "#";
    link.id = fieldName + "-tooltip";
    link.className = fieldName + "-tooltip";
    link.tabIndex = -1;
    link.innerText = labelText;
    link.addEventListener("click", (e) => e.preventDefault());
    labelElement.insertAdjacentElement("afterend", link);

    let wrapper = document.createElement("span");
    wrapper.className = "label-wrapper";
    labelElement.parentNode.insertBefore(wrapper, labelElement);
    wrapper.appendChild(labelElement);
    wrapper.appendChild(link);

    tippy("#" + fieldName + "-tooltip", {
      content: tooltipText,
    });
  }

  addTooltip(
    document.querySelector(".en__field--title.en__mandatory > label"),
    "title",
    "Why is this required?",
    "The U.S. Senate is now requiring that all letters include one of the following titles: Mr., Mrs., Miss, Ms., Dr. We understand that not everyone identifies with one of these titles, and we have provided additional options. However, in order to ensure that your action lands in the inbox of your Senator, you may need to select one of these options."
  );

  addTooltip(
    document.querySelector(".en__field--ccvv > label"),
    "ccv",
    "What's this?",
    "The three or four digit security code on your debit or credit card"
  );

  if (App.getPageType() === "DONATION") {
    addTooltip(
      document.querySelector(".en__field--postcode > label"),
      "postcode",
      "?",
      "If donating with a Credit Card, your Zip Code must match your billing address."
    );
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

  const digitalWalletWrapper = document.querySelector("#en__digitalWallet");
  const giveBySelect = document.querySelector(".give-by-select");
  if (digitalWalletWrapper && giveBySelect) {
    giveBySelect.appendChild(digitalWalletWrapper);
    digitalWalletWrapper.insertAdjacentHTML(
      "beforeend",
      "<div class='digital-divider recurring-frequency-y-hide'><span class='divider-left'></span><p class='divider-center'>or enter manually</p><span class='divider-right'></span></div>"
    );

    const applePayWrapper = document.querySelector(".applePayWrapper");
    const digitalDivider = document.querySelector(".digital-divider");
    if (applePayWrapper && digitalDivider) {
      digitalDivider.insertAdjacentElement("beforebegin", applePayWrapper);
    }

    let digitalWalletsExist;

    digitalWalletsExist = document.querySelectorAll(
      ".en__digitalWallet__container > *"
    );
    if (digitalWalletsExist.length > 0) {
      giveBySelect.setAttribute("show-wallets", "");
    }

    setTimeout(function () {
      let digitalWalletsExist = document.querySelectorAll(
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
    // Check if a digital wallet container was loaded
    const config = { attributes: true, childList: true, subtree: true };
    let isLoaded = false;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "childList" &&
          mutation.addedNodes.length > 0 &&
          !isLoaded
        ) {
          const giveBySelectItems = document.querySelectorAll(
            ".give-by-select .card, .give-by-select .paypal, .give-by-select .check"
          );
          giveBySelectItems.forEach((item) => {
            item.classList.add("recurring-frequency-n-hide");
          });
          isLoaded = true;
        }
      });
    });
    observer.observe(digitalWalletWrapper, config);
  }

  //GTM event handling for opted in on previous page in session
  const enForm = EnForm.getInstance();
  enForm.onSubmit.subscribe(() => {
    const optedInInSession = sessionStorage.getItem("opted_in_this_session");

    //If user didn't opt in in this session yet, check if they opted in on this page
    if (optedInInSession !== "true") {
      const optedIn = !!document.querySelector(
        ".en__field__item:not(.en__field--question) input[name^='supporter.questions'][type='checkbox']:checked"
      );
      sessionStorage.setItem("opted_in_this_session", optedIn.toString());
    }

    // if we're submitting the last page or 2nd to last page,
    if (
      window.pageJson.pageNumber === window.pageJson.pageCount ||
      window.pageJson.pageNumber === pageJson.pageCount - 1
    ) {
      // and the user has opted in on a previous page, push the event to the dataLayer
      if (optedInInSession === "true") {
        window.dataLayer.push({
          event: "EN_SUBMISSION_WITH_EMAIL_OPTIN_ON_A_PREVIOUS_PAGE",
        });
        sessionStorage.removeItem("opted_in_this_session");
      }
    }
  });
};
