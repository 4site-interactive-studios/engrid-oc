import { Options, App } from "@4site/engrid-common"; // Uses ENGrid via NPM
// import { Options, App } from "../../engrid-scripts/packages/common"; // Uses ENGrid via Visual Studio Workspace
import "./sass/main.scss";

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
    donor: document.getElementsByName("transaction.donationAmt.other")
      .length,
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
          return (
            encodeURIComponent(k) + "=" + encodeURIComponent(data[k])
          );
        })
        .join("&");

  var xhr = window.XMLHttpRequest
    ? new XMLHttpRequest()
    : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.open("POST", url);
  xhr.onreadystatechange = function () {
    if (
      xhr.readyState > 3 &&
      (xhr.status == 200 || xhr.status == 202)
    ) {
      success(xhr.responseText);
    }
  };
  xhr.setRequestHeader(
    "Content-Type",
    "application/x-www-form-urlencoded"
  );
  xhr.send(params);
  return xhr;
}


const options: Options = {
  ModalDebug: true,
  applePay: false,
  CapitalizeFields: true,
  ClickToExpand: true,
  CurrencySymbol: '$',
  CurrencySeparator: '.',
  MediaAttribution: true,
  onLoad: () => console.log("Starter Theme Loaded"),
  onResize: () => console.log("Starter Theme Window Resized"),
  onSubmit: () => {
    console.log('%c Upland / Mobilecommons Script', 'font-size: 30px; background-color: #000; color: #FF0');
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
  }

};
new App(options);