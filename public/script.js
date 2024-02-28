function saveData() {
  // Clear previous error messages
  clearErrorMessages();
  const userData = {
    firstName: $("#firstName").val(),
    lastName: $("#lastName").val(),
    mobileNo: $("#mobileNo").val(),
    email: $("#email").val(),
    address: {
      street: $("#street").val(),
      city: $("#city").val(),
      state: $("#state").val(),
      country: $("#country").val(),
    },
    loginId: $("#loginId").val(),
    password: $("#password").val(),
  };

  $.ajax({
    type: "POST",
    url: "/api/validate",
    data: JSON.stringify(userData),
    contentType: "application/json",
    success: function (response) {
      if (response.success) {
        // If server-side validation passes, proceed to save data
        saveDataToServer(userData);
      } else {
        // Display server-side validation errors on the client side
        displayValidationErrors(response.errors);
      }
    },
    error: function (error) {
      console.error("Error:", error);
      $("#resultMessage").text("An unexpected error occurred.");
    },
  });

  function saveDataToServer(userData) {
    // Make another AJAX request to save data to the server
    $.ajax({
      type: "POST",
      url: "/",
      contentType: "application/json",
      data: JSON.stringify(userData),
      success: function (response) {
        console.log("Server Response:", response);
        if (response.success) {
          console.log("Redirecting to /users"); // Add this line for debugging
          $("#resultMessage").text(response.message).css("color", "green");
          // Optionally, reset the form after successful submission
          $("#dataForm")[0].reset();
          window.location.href = "/users";
        } else {
          $("#resultMessage")
            .text("Error: " + response.message)
            .css("color", "red");
        }
      },
      error: function (error) {
        console.error("Error:", error);
        $("#resultMessage")
          .text("An unexpected error occurred.")
          .css("color", "red");
      },
    });
  }

  function displayValidationErrors(errors) {
    // Display server-side validation errors on the client side
    Object.keys(errors).forEach((field) => {
      const errorDiv = $("#" + field + "Error");
      errorDiv.text(errors[field]);
    });
  }

  function clearErrorMessages() {
    const errorDivs = $('[id$="Error"]');
    errorDivs.each(function () {
      $(this).text("");
    });
  }
}
