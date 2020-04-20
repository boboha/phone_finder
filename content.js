const classPhone = "pf-phone";
const classPopup = "pf-popup";
const classApp = "pf-app";
const classActive = "active";
const popup = document.createElement('div');
const pattern_class = new RegExp(`${classPhone}|${classPopup}|${classApp}`);
const pattern_tag = /(script|noscript|style|iframe|frame|frameset|noframe|object|param|nav|menu|form|textarea|input|label|select|option|button|source|time|img|map|abr|acronim|code|del|kbd|output|progress|samp|sub|sup|hr|br|wbr|area|audio|video|canvas|svg|embed|figure)/i;
const pattern_phone = /((\+?38 ?|8 ?)?(\( |\()?0 ?\(? ?([5-7,9]\d)([ )-]{0,3}\d){2}([- ]?\d){5})|(\+\d([-( ]{0,3}\d[ -(]{0,3}){1,2}([ -]?\d[ -]?){2}([ )-]{0,3}\d){2}([- ]?\d){5})/g;
const normalizeNeeded = [];
const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
        if (mutation.addedNodes) {
            for (const node of mutation.addedNodes) {
                if (pattern_tag.test(node.nodeName) || node.className === classPhone) continue;
                highlight(node);
            }
        }
    }
});

function run(show) {
    if (show) {
        highlight();
        observer.observe(document.body, {childList: true, subtree: true});
    } else {
        observer.disconnect();
        removeHighlights();
    }

    if (!popup.childNodes.length) {
		createPopup();
	}
}

function highlight(node = document.body) {
    if (node.nodeType === 3 && node.data.length > 8) {
        const matches = node.data.match(pattern_phone);
        if (matches) {
            for (const match of matches) {
                const phone = match.trim();
                const phonePos = node.data.indexOf(phone);
                if (phonePos > -1) {
                    const middlebit = node.splitText(phonePos);
                    if (middlebit.parentNode) {
                        middlebit.splitText(phone.length);
                        const middleclone = middlebit.cloneNode(true);

                        const phoneElem = document.createElement('span');
                        phoneElem.className = classPhone;
                        phoneElem.appendChild(middleclone);
                        middlebit.parentNode.replaceChild(phoneElem, middlebit);

                        bindMouseEnter(phoneElem);
                        bindMouseLeave(phoneElem);
                    }
                }
            }
        }
    } else if (node.nodeType === 1 && node.childNodes && !pattern_tag.test(node.tagName)) {
        if (node.className !== classPhone) {
            for (const childNode of node.childNodes) {
                highlight(childNode);
            }
        }
    }
}

function removeHighlights() {
    document.querySelectorAll(`.${classPhone}`).forEach((elem) => {
        const parent = elem.parentNode;
        parent.replaceChild(elem.firstChild, elem);
		normalizeText(parent);
    });
}

function createPopup() {
    const viber = '<a href="" class="' + classApp + ' app1" title="Viber"></a>';
    const wattsapp = '<a href="" target="_blank" class="' + classApp + ' app2" title="WhatsApp"></a>';
    const phone = '<a href="" class="' + classApp + ' app3" title="Phone"></a>';
    popup.className = classPopup;
    popup.innerHTML = wattsapp + viber + phone;
    document.body.appendChild(popup);
    bindMouseLeave(popup);
}

function bindMouseEnter(elem) {
    elem.addEventListener('mouseenter', (event) => {
        const popupHeight = parseInt(getComputedStyle(popup).height);
        const phone = normalizePhone(event.target.innerText.replace(/\D/g, ''));
        const phoneRect = event.target.getBoundingClientRect();

        popup.style.left = phoneRect.left + 'px';
        popup.style.top = phoneRect.top > 40 ? (phoneRect.top - popupHeight) + 'px' : (phoneRect.top + phoneRect.height) + 'px';

        popup.querySelector('.app1').href = 'viber://chat?number=' + phone;
        // popup.querySelector('.app2').href = 'https://api.whatsapp.com/send?phone=' + phone;
        popup.querySelector('.app2').href = 'https://web.whatsapp.com/send?phone=' + phone;
        popup.querySelector('.app3').href = 'tel:' + phone;

        event.target.classList.add(classActive);
        popup.classList.add(classActive);
    });
}

function bindMouseLeave(elem) {
    elem.addEventListener('mouseleave', (event) => {
        if (!pattern_class.test(event.relatedTarget.className)) {
            popup.classList.remove(classActive);
			if (event.target.classList.contains(classPhone)) {
				event.target.classList.remove(classActive);
			} else {
				document.querySelector(`.${classPhone}.${classActive}`).classList.remove(classActive);
			}
        }
    });
}

function normalizePhone(phone) {
    switch (phone.length) {
        case 11: //8 050 123 4567
            if (phone.startsWith('80'))
                phone = '3' + phone;
            break;
        case 10: // 050 123 4567
            if (phone[0] === '0')
                phone = '38' + phone;
            break;
    }
    if (phone.startsWith('380') || (phone[0] !== '+' && (phone.length === 11 || phone.length === 12))) {
        phone = '+' + phone;
    }
    return phone;
}

function normalizeText(elem) {
	if (normalizeNeeded.length === 0) {
		setTimeout(() => {
			for (const node of normalizeNeeded) {
				node.normalize();
			}
			normalizeNeeded.length = 0;
		}, 0);
	}
		

	if (!normalizeNeeded.includes(elem)) {
		normalizeNeeded.push(elem);
	}
}

chrome.runtime.onMessage.addListener((request) => {
    run(request.action);
});

if (chrome && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['enabled'], (result) => {
        if (result['enabled']) {
			run(true);
		}
    });
}