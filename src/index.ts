// import { Options, App } from "@4site/engrid-common"; // Uses ENGrid via NPM
import { Options, App } from "../../engrid-scripts/packages/common"; // Uses ENGrid via Visual Studio Workspace
import "./sass/main.scss";
import "./scripts/main.js";

declare global {
  interface Window {
    DataCaptureID: any;
    pageJson: any;
  }
}

function getUserData() {
  let phone = App.getFieldValue("supporter.phoneNumber");
  let sms_message_opt_in = document.getElementById(
    "en__field_supporter_questions_178688"
  ) as HTMLInputElement | null;
  if (!phone || !sms_message_opt_in || !sms_message_opt_in.checked)
    return false;
  return {
    firstname: App.getFieldValue("supporter.firstName"),
    lastname: App.getFieldValue("supporter.lastName"),
    address1: App.getFieldValue("supporter.address1"),
    address2: App.getFieldValue("supporter.address2"),
    city: App.getFieldValue("supporter.city"),
    state: App.getFieldValue("supporter.region"),
    country: App.getFieldValue("supporter.country"),
    postal_code: App.getFieldValue("supporter.postcode"),
    msisdn: phone,
    email: App.getFieldValue("supporter.emailAddress"),
    phone: phone.replace(/\D/g, ""),
    optin_path_key: "OP1AF618AA53A977C5E6EE7A033BA8BDDB",
    donor: document.getElementsByName("transaction.donationAmt.other").length,
    tags: "OC_EN_Form",
    source: App.getPageType(),
  };
}

function postAjax(url: string, data: any, success: Function) {
  var params =
    typeof data == "string"
      ? data
      : Object.keys(data)
          .map(function (k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
          })
          .join("&");

  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.onreadystatechange = function () {
    if (xhr.readyState > 3 && (xhr.status == 200 || xhr.status == 202)) {
      success(xhr.responseText);
    }
  };
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.send(params);
  return xhr;
}

// Data Capture Code
function dataCapture() {
  {
    const isEN = !!("pageJson" in window);
    const hasError = !!document.querySelector(".en__errorHeader");
    const dcId = "DataCaptureID" in window ? window.DataCaptureID : 74684;
    const url = `https://takeaction.oceanconservancy.org/page/${dcId}/data/1`;
    const optInCheck = document.querySelector(
      "[name='supporter.questions.20087']"
    ) as HTMLInputElement;
    const form = document.querySelector(
      "form.en__component"
    ) as HTMLFormElement;
    const inIframe = () => {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    };
    const createIframe = (src: string) => {
      let ifrm = document.createElement("iframe");
      ifrm.setAttribute("src", src);
      ifrm.style.width = "0px";
      ifrm.style.height = "0px";
      document.body.appendChild(ifrm);
    };
    const createField = (name: string, value: string) => {
      let input = document.createElement("input");

      input.setAttribute("type", "hidden");

      input.setAttribute("name", name);

      input.setAttribute("value", value);

      //append to form element that you want .
      form.appendChild(input);
    };
    // Is we're not in an EN page, get out
    if (!isEN) {
      return;
    }
    if (App.getPageType() == "DONATION") {
      // Donation Page
      if (hasError) {
        // The Donation Code will be executed only if we got a backend error
        console.log("Data Capture Donation", dcId);
        const formData = new FormData(form);
        if (optInCheck && optInCheck.checked) {
          // The fields we want to send
          const formFields = [
            "supporter.firstName",
            "supporter.lastName",
            "supporter.emailAddress",
            "supporter.questions.20087",
          ];
          const data = [...formData.entries()];
          const asString =
            "?" +
            data
              .filter((element) => formFields.includes(element[0]))
              .map(
                (x) =>
                  `${encodeURIComponent(x[0])}=${encodeURIComponent(
                    x[1].toString()
                  )}`
              )
              .join("&");
          console.log(url + asString);
          createIframe(url + asString);
        }
      }
    } else if (inIframe()) {
      // We only execute the Data Capture Page if we're ALSO embedded as iFrame
      console.log("Data Capture Iframe");
      // Get data from URL and create the Fields
      const urlParams = new URLSearchParams(window.location.search);
      for (const [key, value] of urlParams.entries()) {
        createField(key, value);
      }
      // Send the Form
      form.submit();
    }
  }
}

const options: Options = {
  applePay: true,
  CapitalizeFields: true,
  ClickToExpand: true,
  CurrencySymbol: "$",
  DecimalSeparator: ".",
  MediaAttribution: true,
  SkipToMainContentLink: true,
  SrcDefer: true,
  NeverBounceAPI: "public_45feb67a2317d1f97b59ba35cc2b7118",
  NeverBounceDateField: "supporter.NOT_TAGGED_116",
  NeverBounceStatusField: "supporter.NOT_TAGGED_59",
  Debug: App.getUrlParameter("debug") == "true" ? true : false,
  onLoad: () => {
    console.log("Starter Theme Loaded"); /*dataCapture();*/
  },
  onResize: () => console.log("Starter Theme Window Resized"),
  onSubmit: () => {
    console.log(
      "%c Upland / Mobilecommons Script",
      "font-size: 30px; background-color: #000; color: #FF0"
    );
    return new Promise(function (resolve, reject) {
      let userData = getUserData();
      console.log("User Data", userData);
      if (!userData) return resolve(true);
      postAjax(
        "https://oceanconservancy.org/wp-admin/admin-ajax.php?action=upland_sms_signup",
        userData,
        function (data: string) {
          console.log("Response Data", data);
          var response = JSON.parse(data);
          if (response.error) console.log("error adding contact");
          else console.log(response.message);
          resolve(true);
        }
      );
    });
  },
};
new App(options);
