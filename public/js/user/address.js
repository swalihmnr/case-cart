import api from "../api.js";
import { showGlobalLoading, hideGlobalLoading } from "../ui-helpers.js";

// ─── Shared validation rules ───────────────────────────────────────────────
const RULES = {
  firstName: {
    el: "first-name",
    err: "firstNameError",
    validate(v) {
      if (!v) return "First name is required";
      if (!/^[A-Za-z\s]+$/.test(v)) return "First name must contain only letters";
      if (v.length < 2) return "First name must be at least 2 characters";
      if (v.length > 30) return "First name must be at most 30 characters";
      return null;
    },
  },
  lastName: {
    el: "last-name",
    err: "lastNameError",
    validate(v) {
      if (!v) return "Last name is required";
      if (!/^[A-Za-z\s]+$/.test(v)) return "Last name must contain only letters";
      if (v.length > 30) return "Last name must be at most 30 characters";
      return null;
    },
  },
  phone: {
    el: "phone",
    err: "phoneError",
    validate(v) {
      if (!v) return "Phone number is required";
      if (!/^[6-9]\d{9}$/.test(v)) return "Enter a valid 10-digit Indian mobile number";
      return null;
    },
  },
  streetAddress: {
    el: "line1",
    err: "line1Error",
    validate(v) {
      if (!v) return "Street address is required";
      if (v.length < 5) return "Street address must be at least 5 characters";
      if (v.length > 100) return "Street address must be at most 100 characters";
      return null;
    },
  },
  city: {
    el: "city",
    err: "cityError",
    validate(v) {
      if (!v) return "City is required";
      if (!/^[A-Za-z\s]+$/.test(v)) return "City must contain only letters";
      if (v.length < 2) return "City must be at least 2 characters";
      return null;
    },
  },
  state: {
    el: "state",
    err: "stateError",
    validate(v) {
      if (!v) return "Please select a state";
      return null;
    },
  },
  pincode: {
    el: "pincode",
    err: "pincodeError",
    validate(v) {
      if (!v) return "PIN code is required";
      if (!/^\d{6}$/.test(v)) return "PIN code must be exactly 6 digits";
      return null;
    },
  },
  addressType: {
    err: "addressTypeError",
    validate(v) {
      if (!v) return "Please select an address type";
      return null;
    },
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function setError(errId, msg) {
  const el = document.getElementById(errId);
  if (el) el.textContent = msg || "";
}

function clearAllErrors() {
  Object.values(RULES).forEach((r) => setError(r.err, ""));
}

function getFieldValue(key) {
  if (key === "addressType") {
    return document.querySelector('input[name="addressType"]:checked')?.value || "";
  }
  const id = RULES[key].el;
  return (document.getElementById(id)?.value || "").trim();
}

// Validate a single field; returns true if valid
function validateField(key) {
  const v = getFieldValue(key);
  const msg = RULES[key].validate(v);
  setError(RULES[key].err, msg || "");
  return !msg;
}

// Validate all fields; returns true if all pass
function validateAll() {
  let valid = true;
  Object.keys(RULES).forEach((key) => {
    if (!validateField(key)) valid = false;
  });
  return valid;
}

// ─── Attach real-time validation on input/change ───────────────────────────
function attachLiveValidation() {
  Object.entries(RULES).forEach(([key, rule]) => {
    if (key === "addressType") {
      document.querySelectorAll('input[name="addressType"]').forEach((radio) => {
        radio.addEventListener("change", () => validateField(key));
      });
      return;
    }
    const el = document.getElementById(rule.el);
    if (!el) return;
    const eventType = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(eventType, () => validateField(key));
    el.addEventListener("blur", () => validateField(key));
  });
}

// ─── Form submit ───────────────────────────────────────────────────────────
document.querySelector("#addressForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAllErrors();

  if (!validateAll()) return;

  const payload = {
    firstName:    getFieldValue("firstName"),
    lastName:     getFieldValue("lastName"),
    phone:        getFieldValue("phone"),
    streetAddress: getFieldValue("streetAddress"),
    landmark:     (document.getElementById("landmark")?.value || "").trim(),
    city:         getFieldValue("city"),
    state:        getFieldValue("state"),
    pincode:      getFieldValue("pincode"),
    addressType:  getFieldValue("addressType"),
    isDefault:    document.getElementById("isDefault")?.checked ?? false,
  };

  showGlobalLoading();
  try {
    const res = await api.addAddressAxios(payload);
    if (res.data.success) {
      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: res.data.message,
        confirmButtonColor: "#667eea",
      }).then(() => {
        location.href = "/address";
      });
    } else {
      Swal.fire({ icon: "warning", text: res.data.message, confirmButtonColor: "#667eea" });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Something went wrong while saving address",
      confirmButtonColor: "#667eea",
    });
  } finally {
    hideGlobalLoading();
  }
});

// ─── Helper exposed for listing page ──────────────────────────────────────
async function editForm(addressId) {
  window.location.href = `/address/edit/${addressId}`;
}
window.editForm = editForm;

// Kick off real-time validation
attachLiveValidation();
