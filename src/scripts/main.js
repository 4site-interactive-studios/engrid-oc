const tippy = require("tippy.js").default;

export const customScript = function (App, EnForm) {
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

  const selects = document.querySelectorAll("select");
  if (selects) {
    selects.forEach((select) => {
      select.dataset.selectedValue = select.value ?? "";
    });
  }

  document.addEventListener("change", function (event) {
    const target = event.target;
    if (target && target.tagName === "SELECT") {
      target.dataset.selectedValue = target.value ?? "";
    }
  });

  /**
   * This function replaces the CSS class of a specified element that has a legacy class name.
   * The replacement is applied only if the <body> element has the data attribute "data-engrid-theme" set to "oc2".
   */

  function legacyGiftFrequencyAndAmountFormComponent() {
    // Check if the <body> element has the data attribute data-engrid-theme="oc2"
    const bodyElement = document.querySelector("body[data-engrid-theme='oc2']");
    if (!bodyElement) {
      // If the data attribute is not present, exit the function
      return;
    }

    // Get the element with the old CSS class
    const oldClassElement = document.querySelector(".en__component.en__component--formblock.recurring-frequency_count_3.radio-to-buttons_donationAmt.donation-amount_count_4.i1-hide-label.i2-hide.i3-hide-label");

    // Check if the element with the old class exists
    if (oldClassElement) {
      // Define the new CSS class
      const newClass = "en__component en__component--formblock recurring-frequency_count_2 radio-to-buttons_recurrfreq radio-to-buttons_donationAmt donation-amount_count_3 i1-hide-label i2-hide i3-hide-label";

      // Remove the old class from the element
      oldClassElement.classList.remove("en__component", "en__component--formblock", "recurring-frequency_count_3", "radio-to-buttons_donationAmt", "donation-amount_count_4", "i1-hide-label", "i2-hide", "i3-hide-label");

      // Add the new class to the element
      oldClassElement.classList.add(...newClass.split(" "));
    }
  }

  // Call the function to replace the class if the specified condition is met
  legacyGiftFrequencyAndAmountFormComponent();

  /**
   * This function checks if there are no results for ".page-backgroundImage > img" and
   * moves the contents of ".body-banner" to ".page-backgroundImage" if needed.
   */
  function legacyMoveBodyBannerToPageBackground() {
    // Check if there are no results for ".page-backgroundImage > img"
    const pageBackgroundImages = document.querySelectorAll(".page-backgroundImage img");
    if (pageBackgroundImages.length === 0) {
      console.log("No page background images found.");

      // Get the elements inside ".body-banner"
      const bodyBanner = document.querySelector(".body-banner");
      if (bodyBanner) {
        console.log("Moving contents from .body-banner to .page-backgroundImage");

        // Get the ".page-backgroundImage" element
        const pageBackground = document.querySelector(".page-backgroundImage");
        if (pageBackground) {
          // Move the contents of ".body-banner" to ".page-backgroundImage"
          while (bodyBanner.firstChild) {
            pageBackground.appendChild(bodyBanner.firstChild);
          }
          console.log("Contents moved successfully.");

          // Get the image element inside ".pageBackground" again
          const pageBackgroundImage = pageBackground.querySelector("img");

          if (pageBackgroundImage) {
            // Get the image source (src) from the pageBackgroundImage
            const imageSrc = pageBackgroundImage.getAttribute("src");

            // Set the image source as a CSS custom property on the ".page-backgroundImage" element
            pageBackground.style.setProperty("--engrid__page-backgroundImage_url", `url('${imageSrc}')`);
            console.log(`Image source set as CSS custom property: --engrid__page-backgroundImage_url: url('${imageSrc}')`);

            // Update the data attribute on the <body> element to be "image"
            document.body.setAttribute("data-engrid-page-background", "image");
            console.log("data-engrid-page-background attribute updated to 'image' on <body>.");

            // Set data-engrid-body-banner="empty" on the <body> element
            document.body.setAttribute("data-engrid-body-banner", "empty");
            console.log("data-engrid-body-banner attribute set to 'empty' on <body>.");

            // Set data-replace-banner-with-background="if-banner-empty" on the <body> element
            document.body.setAttribute("data-replace-banner-with-background", "if-banner-empty");
            console.log("data-replace-banner-with-background attribute set to 'if-banner-empty' on <body>.");
          } else {
            console.log("Image not found inside .page-backgroundImage.");
          }

          // Remove the data attribute from the <body> element
          document.body.removeAttribute("data-engrid-no-page-backgroundimage");
          console.log("data-engrid-no-page-backgroundimage attribute removed from <body>.");
        } else {
          console.log(".page-backgroundImage not found. Cannot move contents.");
        }
      } else {
        console.log(".body-banner not found. Nothing to move.");
      }
    } else {
      console.log("Page background images found. No need to move contents.");
    }
  }

  // Call the function to move contents if needed
  legacyMoveBodyBannerToPageBackground();

  /**
   * This function checks the values of [for*="en__field_transaction_recurrfreq"] elements
   * and updates them based on specific criteria.
   */
  function legacyUpdateRecurrfreqValues() {
    const recurrfreqElements = document.querySelectorAll('[for*="en__field_transaction_recurrfreq"]');

    recurrfreqElements.forEach((element) => {
      const value = element.textContent.trim();

      switch (value) {
        case "Give Once":
          element.textContent = "One-Time";
          console.log(`Updated "${value}" to "One-Time"`);
          break;
        case "Give Monthly":
          element.textContent = "Monthly";
          console.log(`Updated "${value}" to "Monthly"`);
          break;
        case "Give Annually":
          element.textContent = "Annually";
          console.log(`Updated "${value}" to "Annually"`);
          break;
        default:
          console.log(`No update needed for "${value}"`);
          break;
      }
    });
  }

  // Call the function to update recurrfreq values
  legacyUpdateRecurrfreqValues();

  /**
   * This function checks for the presence of ".content-footer > .en__component--copyblock + .en__component--copyblock > p"
   * and if it exists, it gets its content and sets it as a data attribute on ".page-backgroundImage img" as "data-attribution-source".
   * It also adds a new <figattribution> element with the same value inside wrapped in a <p> tag after the <img> tag,
   * and removes the original attribution element.
   */
  function legacySetBackgroundImageAttributionSource() {
    const attributionElement = document.querySelector(
      '.content-footer > .en__component--copyblock + .en__component--copyblock > p'
    );

    if (attributionElement) {
      const backgroundImage = document.querySelector('.page-backgroundImage img');

      if (backgroundImage) {
        const attributionContent = attributionElement.textContent.trim();
        backgroundImage.setAttribute('data-attribution-source', attributionContent);
        console.log(`Set "data-attribution-source" to "${attributionContent}"`);

        // Create the <figattribution> element with the content and wrap it in a <p> tag
        const figAttribution = document.createElement('figattribution');
        const pTag = document.createElement('p');
        pTag.textContent = attributionContent;
        figAttribution.appendChild(pTag);

        // Insert the <figattribution> element after the <img> tag
        backgroundImage.insertAdjacentElement('afterend', figAttribution);

        // Remove the original attribution element
        attributionElement.remove();
        console.log('Original attribution element removed.');
      }
    }
  }

  // Call the function to set the background image attribution source, add <figattribution> element, and remove the original attribution element
  legacySetBackgroundImageAttributionSource();

  /**
   * This function moves the "--banner-image-height" custom attribute from the "img" tag inside ".page-backgroundImage"
   * and adds it to the ".page-backgroundImage" element's style attribute, ensuring not to overwrite any existing styles.
   */
  function legacyMoveBannerImageHeightToBackgroundImage() {
    const pageBackgroundImage = document.querySelector('.page-backgroundImage');
    const backgroundImage = pageBackgroundImage.querySelector('img');

    if (pageBackgroundImage && backgroundImage) {
      // Get the "--banner-image-height" style from the "img" tag
      const bannerImageHeightStyle = backgroundImage.getAttribute('style');

      if (bannerImageHeightStyle) {
        // Remove the "--banner-image-height" style from the "img" tag
        backgroundImage.setAttribute(
          'style',
          bannerImageHeightStyle.replace(/(--banner-image-height:[^;]+;?)/g, '').trim()
        );

        // Append the "--banner-image-height" style to the ".page-backgroundImage" style
        const pageBackgroundImageStyle = pageBackgroundImage.getAttribute('style');
        pageBackgroundImage.setAttribute(
          'style',
          `${pageBackgroundImageStyle ? pageBackgroundImageStyle + ' ' : ''}${bannerImageHeightStyle}`
        );
      }
    }
  }

  // Call the function to move "--banner-image-height" from the "img" tag to ".page-backgroundImage" style
  legacyMoveBannerImageHeightToBackgroundImage();


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
