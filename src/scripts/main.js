const tippy = require("tippy.js").default;

export const customScript = function (EnForm) {
  console.log("ENGrid client scripts are executing");
  // Add your client scripts here
  const theme = document.body.dataset.engridTheme;

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
  if (theme === "oc") {
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

  if (theme === "oc2") {
    const bgImageTooltip = document.querySelector(
      ".page-backgroundImage figattribution"
    );

    if (bgImageTooltip) {
      const bgImageTooltipText = bgImageTooltip.innerHTML;

      bgImageTooltip.insertAdjacentHTML(
        "afterend",
        `<div id="mobile-bg-tooltip"></div>`
      );
      tippy("#mobile-bg-tooltip", {
        theme: "black",
        content: bgImageTooltipText,
        allowHTML: true,
        arrow: true,
        arrowType: "default",
        placement: "left",
        trigger: "click mouseenter focus",
        interactive: true,
      });
    }

    document.querySelectorAll(".click-to-expand-cta").forEach((el) => {
      el.addEventListener("click", () => {
        el.parentElement.classList.add("expanded");

        const buttonContainer = document.querySelector(
          ".engrid-mobile-cta-container"
        );
        if (buttonContainer) buttonContainer.style.display = "block";
      });
    });
  }
};
