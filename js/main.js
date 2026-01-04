(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();
    
    
    // Initiate the wowjs
    new WOW().init();


    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 0) {
            $('.navbar').addClass('position-fixed bg-dark shadow-sm');
        } else {
            $('.navbar').removeClass('position-fixed bg-dark shadow-sm');
        }
    });
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Testimonials carousel
    $('.testimonial-carousel').owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        loop: true,
        nav: false,
        dots: true,
        items: 1,
        dotsData: true,
    });


    // Newsletter subscribe: email -> name popup -> thank you -> reload
    var ensureNewsletterModals = function () {
        if (document.getElementById('newsletterNameModal')) return;

        var modalMarkup = ''
            + '<div class="modal fade" id="newsletterNameModal" tabindex="-1" aria-hidden="true">'
            + '  <div class="modal-dialog modal-dialog-centered">'
            + '    <div class="modal-content bg-dark text-light">'
            + '      <div class="modal-header border-secondary">'
            + '        <h5 class="modal-title text-uppercase">Almost done</h5>'
            + '        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>'
            + '      </div>'
            + '      <div class="modal-body">'
            + '        <p class="mb-3">Please enter your first and last name.</p>'
            + '        <form id="newsletterNameForm" novalidate>'
            + '          <div class="row g-3">'
            + '            <div class="col-12 col-md-6">'
            + '              <label class="form-label" for="newsletterFirstName">First name</label>'
            + '              <input class="form-control bg-secondary border-0" id="newsletterFirstName" name="firstName" type="text" required>'
            + '            </div>'
            + '            <div class="col-12 col-md-6">'
            + '              <label class="form-label" for="newsletterLastName">Last name</label>'
            + '              <input class="form-control bg-secondary border-0" id="newsletterLastName" name="lastName" type="text" required>'
            + '            </div>'
            + '          </div>'
            + '          <div class="d-flex justify-content-end mt-4">'
            + '            <button type="submit" class="btn btn-primary">Send</button>'
            + '          </div>'
            + '        </form>'
            + '      </div>'
            + '    </div>'
            + '  </div>'
            + '</div>'
            + '<div class="modal fade" id="newsletterThanksModal" tabindex="-1" aria-hidden="true">'
            + '  <div class="modal-dialog modal-dialog-centered">'
            + '    <div class="modal-content bg-dark text-light">'
            + '      <div class="modal-body text-center py-5">'
            + '        <h4 class="text-uppercase mb-2">Thank you!</h4>'
            + '        <p class="mb-0">You have been subscribed successfully.</p>'
            + '      </div>'
            + '    </div>'
            + '  </div>'
            + '</div>';

        document.body.insertAdjacentHTML('beforeend', modalMarkup);
    };

    var initNewsletterSubscribe = function () {
        var $forms = $('.newsletter-form');
        if ($forms.length === 0) return;

        ensureNewsletterModals();

        var nameModalEl = document.getElementById('newsletterNameModal');
        var thanksModalEl = document.getElementById('newsletterThanksModal');
        if (!nameModalEl || !thanksModalEl || !window.bootstrap) return;

        var nameModal = new bootstrap.Modal(nameModalEl, { backdrop: 'static' });
        var thanksModal = new bootstrap.Modal(thanksModalEl, { backdrop: 'static' });

        var activeForm = null;

        var encodeFormData = function (form) {
            var formData = new FormData(form);
            return new URLSearchParams(formData).toString();
        };

        var postToNetlify = function (form) {
            var postUrl = window.location.pathname || '/';
            return fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: encodeFormData(form)
            });
        };

        $forms.off('submit.newsletter').on('submit.newsletter', function (e) {
            e.preventDefault();

            var form = this;
            var emailInput = form.querySelector('input[name="email"]');

            if (!emailInput) return;
            if (typeof emailInput.reportValidity === 'function' && !emailInput.reportValidity()) return;
            if (!emailInput.value || !emailInput.value.trim()) {
                emailInput.focus();
                return;
            }

            activeForm = form;

            // Reset name fields each time
            var firstNameInput = document.getElementById('newsletterFirstName');
            var lastNameInput = document.getElementById('newsletterLastName');
            if (firstNameInput) firstNameInput.value = '';
            if (lastNameInput) lastNameInput.value = '';

            nameModal.show();
            setTimeout(function () {
                if (firstNameInput) firstNameInput.focus();
            }, 250);
        });

        $('#newsletterNameForm').off('submit.newsletter').on('submit.newsletter', function (e) {
            e.preventDefault();

            var firstNameInput = document.getElementById('newsletterFirstName');
            var lastNameInput = document.getElementById('newsletterLastName');

            if (!firstNameInput || !lastNameInput) return;
            if (typeof firstNameInput.reportValidity === 'function' && !firstNameInput.reportValidity()) return;
            if (typeof lastNameInput.reportValidity === 'function' && !lastNameInput.reportValidity()) return;

            if (!activeForm) return;

            // Copy name values into the Netlify form fields
            var hiddenFirstName = activeForm.querySelector('input[name="firstName"]');
            var hiddenLastName = activeForm.querySelector('input[name="lastName"]');
            if (hiddenFirstName) hiddenFirstName.value = (firstNameInput.value || '').trim();
            if (hiddenLastName) hiddenLastName.value = (lastNameInput.value || '').trim();

            nameModal.hide();

            postToNetlify(activeForm)
                .then(function (res) {
                    if (!res || !res.ok) throw new Error('Newsletter submit failed');
                    thanksModal.show();
                    setTimeout(function () {
                        try { thanksModal.hide(); } catch (err) { /* ignore */ }
                        window.location.reload();
                    }, 1500);
                })
                .catch(function (err) {
                    console.error(err);
                    alert('Sorry, something went wrong. Please try again.');
                });
        });
    };

    initNewsletterSubscribe();


    // Outreach modal: hover zoom around cursor
    var initOutreachImageZoom = function () {
        var zoomContainers = document.querySelectorAll('.outreach-zoom');
        if (!zoomContainers || zoomContainers.length === 0) return;

        zoomContainers.forEach(function (container) {
            var img = container.querySelector('img');
            if (!img) return;

            container.addEventListener('mouseenter', function () {
                container.classList.add('zooming');
            });

            container.addEventListener('mousemove', function (e) {
                var rect = container.getBoundingClientRect();
                if (!rect.width || !rect.height) return;

                var x = ((e.clientX - rect.left) / rect.width) * 100;
                var y = ((e.clientY - rect.top) / rect.height) * 100;

                container.style.setProperty('--zoom-x', x + '%');
                container.style.setProperty('--zoom-y', y + '%');
            }, { passive: true });

            container.addEventListener('mouseleave', function () {
                container.classList.remove('zooming');
                container.style.removeProperty('--zoom-x');
                container.style.removeProperty('--zoom-y');
            });
        });
    };

    initOutreachImageZoom();

    
})(jQuery);

