import { ENGrid } from "@4site/engrid-common";

const tippy = require("tippy.js").default;

export const customScript = function (App, EnForm) {
  console.log("ENGrid client scripts are executing");
  // Add your client scripts here
  const theme = document.body.dataset.engridTheme;

  function addPlaceholder(selector, placeholder) {
    let el = document.querySelector(selector);
    if (el) {
      el.placeholder = placeholder;
    }
  }

  addPlaceholder(
    "input#en__field_supporter_phoneNumber",
    "000-000-0000 (Optional)"
  );
  addPlaceholder("input#en__field_transaction_ccvv", "3 Digits");
  addPlaceholder("input#en__field_supporter_postcode", "ZIP Code");
  addPlaceholder("input#en__field_supporter_address1", "Address Line 1");
  addPlaceholder("input#en__field_supporter_address2", "Address Line 2");

  //On form block with .us-only and a country field, add a notice, set value to US and disable field
  if (
    document.querySelector(
      ".en__component--formblock.us-only .en__field--country"
    )
  ) {
    if (!document.querySelector(".en__field--country .en__field__notice")) {
      App.addHtml(
        '<div class="en__field__notice"><em>Note: This action is limited to U.S. addresses.</em></div>',
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
      "If donating with a Credit Card, your ZIP Code must match your billing address."
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

  function legacyDigitalWalletsSetup() {
    const digitalWalletWrapper = document.querySelector("#en__digitalWallet");
    const giveBySelect = document.querySelector(".give-by-select");
    if (digitalWalletWrapper && giveBySelect) {
      document.body.removeAttribute(
        "data-conditonally-hide-show-digital-wallet-elements"
      );
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
              ".give-by-select .card, .give-by-select .paypal, .give-by-select .check, .give-by-select .paypaltouch"
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

  // Digital Wallets Moving Parts
  if (theme === "oc") {
    legacyDigitalWalletsSetup();
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
   * Function to set the "data-engrid-legacy-theme'" data attribute on the "body" element to "oc1".
   */
  function legacySetLegacyThemeAttribute() {
    document.body.setAttribute("data-engrid-legacy-theme", "oc1");
  }

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
    const oldClassElement = document.querySelector(
      ".en__component.en__component--formblock.recurring-frequency_count_3.radio-to-buttons_donationAmt.donation-amount_count_4.i1-hide-label.i2-hide.i3-hide-label"
    );

    // Check if the element with the old class exists
    if (oldClassElement) {
      // Define the new CSS class
      const newClass =
        "en__component en__component--formblock recurring-frequency_count_2 radio-to-buttons_recurrfreq radio-to-buttons_donationAmt donation-amount_count_3 hide-labels i2-hide";

      // Remove the old class from the element
      oldClassElement.classList.remove(
        "en__component",
        "en__component--formblock",
        "recurring-frequency_count_3",
        "radio-to-buttons_donationAmt",
        "donation-amount_count_4",
        "i1-hide-label",
        "i2-hide",
        "i3-hide-label"
      );

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
    const pageBackgroundImages = document.querySelectorAll(
      ".page-backgroundImage img[src]"
    );
    if (pageBackgroundImages.length === 0) {
      console.log("No page background images found.");

      // Get the elements inside ".body-banner"
      const bodyBanner = document.querySelector(".body-banner");
      if (bodyBanner) {
        console.log(
          "Moving contents from .body-banner to .page-backgroundImage"
        );

        // Get the ".page-backgroundImage" element
        const pageBackground = document.querySelector(".page-backgroundImage");
        if (pageBackground) {
          //Empty the contents of ".page-backgroundImage"
          pageBackground.replaceChildren();
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
            pageBackground.style.setProperty(
              "--engrid__page-backgroundImage_url",
              `url('${imageSrc}')`
            );
            console.log(
              `Image source set as CSS custom property: --engrid__page-backgroundImage_url: url('${imageSrc}')`
            );

            // Update the data attribute on the <body> element to be "image"
            document.body.setAttribute("data-engrid-page-background", "image");
            console.log(
              "data-engrid-page-background attribute updated to 'image' on <body>."
            );

            // Set data-engrid-body-banner="empty" on the <body> element
            document.body.setAttribute("data-engrid-body-banner", "empty");
            console.log(
              "data-engrid-body-banner attribute set to 'empty' on <body>."
            );

            // Set data-replace-banner-with-background="if-banner-empty" on the <body> element
            document.body.setAttribute(
              "data-replace-banner-with-background",
              "if-banner-empty"
            );
            console.log(
              "data-replace-banner-with-background attribute set to 'if-banner-empty' on <body>."
            );
          } else {
            console.log("Image not found inside .page-backgroundImage.");
          }

          // Remove the data attribute from the <body> element
          document.body.removeAttribute("data-engrid-no-page-backgroundimage");
          console.log(
            "data-engrid-no-page-backgroundimage attribute removed from <body>."
          );
          legacySetLegacyThemeAttribute();
          console.log("legacySetLegacyThemeAttribute 1 called");
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
    const recurrfreqElements = document.querySelectorAll(
      '[for*="en__field_transaction_recurrfreq"]'
    );

    recurrfreqElements.forEach((element) => {
      const value = element.textContent.trim();

      switch (value) {
        case "Give Once":
          element.textContent = "One-Time";
          console.log(`Updated "${value}" to "One-Time"`);
          legacySetLegacyThemeAttribute();
          break;
        case "Give Monthly":
          element.textContent = "Monthly";
          console.log(`Updated "${value}" to "Monthly"`);
          legacySetLegacyThemeAttribute();
          break;
        case "Give Annually":
          element.textContent = "Annually";
          console.log(`Updated "${value}" to "Annually"`);
          legacySetLegacyThemeAttribute();
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
   * and if it exists, it gets its content and sets it as a data attribute on ".page-backgroundImage img" as "data-attribution-source" so long as it does not already have an attribution source.
   * It also adds a new <figattribution> element with the same value inside wrapped in a <p> tag after the <img> tag,
   * and removes the original attribution element.
   */
  function legacySetBackgroundImageAttributionSource() {
    const attributionElement = document.querySelector(
      ".content-footer > .en__component--copyblock + .en__component--copyblock > p"
    );

    if (attributionElement) {
      const backgroundImage = document.querySelector(
        ".page-backgroundImage img:not([data-attribution-source])"
      );

      if (backgroundImage) {
        const attributionContent = attributionElement.textContent.trim();
        backgroundImage.setAttribute(
          "data-attribution-source",
          attributionContent
        );
        console.log(`Set "data-attribution-source" to "${attributionContent}"`);

        // Create the <figattribution> element with the content and wrap it in a <p> tag
        const figAttribution = document.createElement("figattribution");
        const pTag = document.createElement("p");
        pTag.textContent = attributionContent;
        figAttribution.appendChild(pTag);

        // Insert the <figattribution> element after the <img> tag
        backgroundImage.insertAdjacentElement("afterend", figAttribution);

        // Remove the original attribution element
        attributionElement.remove();
        console.log("Original attribution element removed.");

        legacySetLegacyThemeAttribute();
        console.log("legacySetLegacyThemeAttribute 6 called");
      }
    }
  }

  // Call the function to set the background image attribution source, add <figattribution> element, and remove the original attribution element
  legacySetBackgroundImageAttributionSource();

  function legacyRemoveDuplicateCopyrightNotice() {
    const copyrightElement = document.querySelector(
      ".content-footer > .en__component--copyblock + .en__component--copyblock > p + p"
    );

    if (copyrightElement) {
      copyrightElement.remove();
    }
  }

  legacyRemoveDuplicateCopyrightNotice();

  function legacyConvertBodyTitleSubheaderTag() {
    const bodyTitleSubheaders = document.querySelectorAll(
      ".body-title > .en__component--copyblock > h2"
    );
    bodyTitleSubheaders.forEach((el) => {
      el.outerHTML = `<h3>${el.innerHTML}</h3>`;
      App.log(`Converted body-title subheader to h3: ${el.innerHTML}`);
    });
  }

  legacyConvertBodyTitleSubheaderTag();

  /**
   * This function moves the "--banner-image-height" custom attribute from the "img" tag inside ".page-backgroundImage"
   * and adds it to the ".page-backgroundImage" element's style attribute, ensuring not to overwrite any existing styles.
   */
  function legacyMoveBannerImageHeightToBackgroundImage() {
    const pageBackgroundImage = document.querySelector(".page-backgroundImage");
    let backgroundImage = null;
    if (pageBackgroundImage) {
      backgroundImage = pageBackgroundImage.querySelector("img");
    }

    if (pageBackgroundImage && backgroundImage) {
      // Get the "--banner-image-height" style from the "img" tag
      const bannerImageHeightStyle = backgroundImage.getAttribute("style");

      if (bannerImageHeightStyle) {
        // Remove the "--banner-image-height" style from the "img" tag
        backgroundImage.setAttribute(
          "style",
          bannerImageHeightStyle
            .replace(/(--banner-image-height:[^;]+;?)/g, "")
            .trim()
        );

        // Append the "--banner-image-height" style to the ".page-backgroundImage" style
        const pageBackgroundImageStyle =
          pageBackgroundImage.getAttribute("style");
        pageBackgroundImage.setAttribute(
          "style",
          `${
            pageBackgroundImageStyle ? pageBackgroundImageStyle + " " : ""
          }${bannerImageHeightStyle}`
        );
      }
    }
  }

  // Call the function to move "--banner-image-height" from the "img" tag to ".page-backgroundImage" style
  legacyMoveBannerImageHeightToBackgroundImage();

  /**
   * Function to check if any of the ".en__field--donationAmt label" elements contain a dollar sign ($).
   */
  function legacyCheckDonationAmtLabelsForDollarSign() {
    const donationAmtLabels = document.querySelectorAll(
      ".en__field--donationAmt label"
    );

    for (const label of donationAmtLabels) {
      const labelValue = label.textContent.trim();

      // Check if the label value contains a dollar sign ($)
      if (labelValue.includes("$")) {
        legacySetLegacyThemeAttribute();
        console.log("legacySetLegacyThemeAttribute 8 called");
      }
    }
  }

  legacyCheckDonationAmtLabelsForDollarSign();

  /**
   * Function to detect if ".page-backgroundImage figure > img + figattribution" exists.
   * If it doesn't, check if ".page-backgroundImage img + figattribution" exists and wrap it in a <figure> tag with the "media-with-attribution" class.
   */
  function legacyWrapFigAttributionWithFigure() {
    const existingFigureAttribution = document.querySelector(
      ".page-backgroundImage figure > img + figattribution"
    );

    if (!existingFigureAttribution) {
      const imgAttribution = document.querySelector(
        ".page-backgroundImage img + figattribution"
      );

      if (imgAttribution) {
        const figure = document.createElement("figure");
        figure.classList.add("media-with-attribution");

        // Wrap the imgAttribution inside the <figure> element
        imgAttribution.parentNode.insertBefore(figure, imgAttribution);
        figure.appendChild(imgAttribution);

        const backgroundImage = document.querySelector(
          ".page-backgroundImage img"
        );

        if (backgroundImage) {
          const figattribution = document.querySelector(
            ".page-backgroundImage figattribution"
          );
          // Move the backgroundImage before the <figureattribution> element
          if (figattribution) {
            figattribution.parentNode.insertBefore(
              backgroundImage,
              figattribution
            );
          }
        }
      }
    }
  }

  // Call the function to wrap figattribution with a figure element if needed
  legacyWrapFigAttributionWithFigure();

  /**
   * Legacy function: Adds the markup "<div class="en__component en__component--copyblock header-with-divider movebefore-en__field--donationAmt"> <p>Select Gift Amount</p> </div>"
   * before ".en__field--donationAmt" if the "<p>Select Gift Amount</p>" markup is not detected in ".body-main .en__component--copyblock p".
   */
  function legacyAddSelectGiftAmountMarkup() {
    const selectGiftAmountParagraphs = document.querySelectorAll(
      ".body-main .en__component--copyblock p"
    );

    const hasSelectGiftAmountMarkup = Array.from(
      selectGiftAmountParagraphs
    ).some((paragraph) => {
      return paragraph.textContent.includes("Select Gift Amount");
    });

    if (!hasSelectGiftAmountMarkup) {
      const giftAmountDiv = document.createElement("div");
      giftAmountDiv.classList.add(
        "en__component",
        "en__component--copyblock",
        "header-with-divider",
        "movebefore-en__field--donationAmt"
      );
      giftAmountDiv.innerHTML = "<p>Select Gift Amount</p>";

      const donationAmtField = document.querySelector(
        ".en__field--donationAmt"
      );
      if (donationAmtField && donationAmtField.parentNode) {
        donationAmtField.parentNode.insertBefore(
          giftAmountDiv,
          donationAmtField
        );
        console.log("Markup added successfully.");
      } else {
        console.log(".en__field--donationAmt not found. Cannot add markup.");
      }
    } else {
      console.log("Markup already exists. Nothing to add.");
    }
  }

  // Call the function to add the markup if needed
  legacyAddSelectGiftAmountMarkup();

  /**
   * Function to rearrange elements on the page by moving specific elements after and before other elements.
   * Moves elements with the "moveafter-en__field--recurrfreq" class after the "en__field--recurrfreq" class,
   * and moves elements with the "movebefore-en__field--donationAmt" class before the "en__field--donationAmt" class.
   */
  function rearrangePageElements() {
    // Move elements with the "moveafter-en__field--recurrfreq" class after the "en__field--recurrfreq" class
    const moveAfterElements = document.querySelectorAll(
      ".moveafter-en__field--recurrfreq"
    );
    const afterElement = document.querySelector(".en__field--recurrfreq");
    if (afterElement && moveAfterElements.length > 0) {
      moveAfterElements.forEach((element) => {
        afterElement.insertAdjacentElement("afterend", element);
      });
    }

    // Move elements with the "movebefore-en__field--donationAmt" class before the "en__field--donationAmt" class
    const moveBeforeElements = document.querySelectorAll(
      ".movebefore-en__field--donationAmt"
    );
    const beforeElement = document.querySelector(".en__field--donationAmt");
    if (beforeElement && moveBeforeElements.length > 0) {
      moveBeforeElements.forEach((element) => {
        beforeElement.insertAdjacentElement("beforebegin", element);
      });
    }
  }

  // Call the function to rearrange elements on the page
  rearrangePageElements();

  function mobileMediaAttribution() {
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
        placement: "left",
        trigger: "click mouseenter focus",
      });
    }
  }

  // Add click-to-expand-cta event listeners
  function clickToExpandCta() {
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

  if (theme === "oc2") {
    mobileMediaAttribution(); // Call the function to set the mobile media attribution tooltip
    clickToExpandCta(); // Call the function to add click-to-expand-cta event listeners

    //support for digital wallets on legacy page layouts running on oc2 theme
    //detecting old payment method layout (digital wallets block inside the card fields form block).
    if (
      document.querySelector(
        ".en__component--formblock.giveBySelect-Card > #en__digitalWallet"
      )
    ) {
      legacyDigitalWalletsSetup();
    }

    //Support for hiding submit button when digital wallet is selected
    //For layouts where we couldn't add this to the form block because the submit button
    //and the digital wallets are on the same form block.
    const submitBtnContainer = document.querySelector(".en__submit");
    if (submitBtnContainer) {
      submitBtnContainer.classList.add(
        "hideif-stripedigitalwallet-selected",
        "hideif-paypaltouch-selected"
      );
    }
  }
};
