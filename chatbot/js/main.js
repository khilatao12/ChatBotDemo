document.addEventListener("DOMContentLoaded", function () {
    const messageContainer = document.querySelector(".chat-body");
    const input = document.querySelector("input");
    const sendButton = document.querySelector("button");
    const micButton = document.querySelector(".mic-icon"); // Icon microphone

    function sendMessage(text, position = "left", isTemporary = false) {
        const messageWrapper = document.createElement("div");
        messageWrapper.classList.add("message-wrapper", position);

        const message = document.createElement("div");
        message.classList.add("message", position);

        if (isTemporary) {
            message.classList.add("temporary");
        }

        message.innerText = text;
        messageWrapper.appendChild(message);


        // Nếu là phản hồi của chatbot, thêm icon loa phát thanh
        if (position === "left" && !isTemporary) {
            const speakerIcon = document.createElement("i");
            speakerIcon.classList.add("fa", "fa-volume-up", "speaker-icon"); // Icon phát thanh
            speakerIcon.style.cursor = "pointer";
            speakerIcon.style.marginLeft = "10px";

            // Gắn sự kiện đọc tin nhắn thành tiếng
            speakerIcon.addEventListener("click", function () {
                speakText(text); // Gọi hàm text-to-speech
            });

            messageWrapper.appendChild(speakerIcon); // Thêm icon vào cuối tin nhắn
        }

        messageContainer.appendChild(messageWrapper);
        messageContainer.scrollTop = messageContainer.scrollHeight;

        return message; // Trả về message element
    }

    async function callAPI(question) {
        console.log("Sending question:", question);
        const response = await fetch("https://flaks-chatbot.onrender.com/get-answer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ question: question }),
        });
        const data = await response.json();
        return data.answer;
    }

    sendButton.addEventListener("click", async function () {
        const userMessage = input.value.trim();
        if (userMessage) {
            sendMessage(userMessage, "right");
            input.value = "";

            const statusMessage = sendMessage("Sending...", "left", true);
            try {
                const botReply = await callAPI(userMessage);

                if (statusMessage) {
                    statusMessage.parentElement.remove();
                }
                sendMessage(botReply, "left");
            } catch (error) {
                console.error("Error calling the API:", error);
                if (statusMessage) {
                    statusMessage.innerText = "Sorry, something went wrong. Please try again.";
                }
            }
        }
    });

    input.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            sendButton.click();
        }
    });

    micButton.addEventListener("click", function () {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
            alert("Trình duyệt của bạn không hỗ trợ chuyển đổi giọng nói thành văn bản!");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = "vi-VN";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();

        recognition.onstart = function () {
            micButton.classList.add("listening");
        };

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            sendButton.click();
        };

        recognition.onerror = function (event) {
            console.error("Speech recognition error:", event.error);
            if (event.error === "not-allowed") {
                sendMessage("Vui lòng cấp quyền truy cập microphone để sử dụng!", "left");
            } else if (event.error === "no-speech") {
                sendMessage("Không nghe thấy âm thanh nào. Vui lòng thử lại.", "left");
            } else {
                sendMessage("Lỗi không xác định: " + event.error, "left");
            }
        };

        recognition.onend = function () {
            micButton.classList.remove("listening");
        };
    });

    // Hàm đọc tin nhắn thành tiếng (Text-to-Speech)
    function speakText(text) {
        // Kiểm tra xem trình duyệt có hỗ trợ SpeechSynthesis không
        if (!("speechSynthesis" in window)) {
            alert("Trình duyệt của bạn không hỗ trợ đọc văn bản thành tiếng.");
            console.error("SpeechSynthesis không được hỗ trợ trong trình duyệt này!");
            return;
        }

        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = "vi-VN"; // Ngôn ngữ tiếng Việt
        utterance.rate = 1; // Tốc độ đọc (1 là mặc định)
        utterance.pitch = 1; // Cao độ giọng nói
        utterance.volume = 1; // Âm lượng

        synth.speak(utterance); // Bắt đầu đọc

        console.log("Đang đọc:", text); // Debug log
    }

    sendMessage("Chào bạn, tôi là chatbot của bạn! Hãy hỏi tôi bất cứ điều gì.", "left");
});
