var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const sendWhatsAppMessage = () => __awaiter(void 0, void 0, void 0, function* () {
    const rawResponse = yield fetch("https://graph.facebook.com/v18.0/263611196840658/messages", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer EAAUtnNZB03NsBOyrQjZAa4P4wpmRK1WYu2J0gtKwo6vbZCEVj9YFQmAEw5ZBBsNIrhdWDKLZBItw5GotikPHkCmIkNkI6aXjVY4ZCZAh8oleZBEr5r3nDLbfIkkUf6A7nixi6k5Pq4AVEc9ven8cSAsTtK0ZAECOziamloHKKrjANGUcs7tGDlhDrsQh5MLZBdZAZCLs8CiA2pljxIqFy3V6",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: "21694300287",
            type: "template",
            template: { name: "hello_world", language: { code: "en_US" } },
        }),
    });
    const content = yield rawResponse.json();
    console.log(content);
});
//# sourceMappingURL=MessageHelper.js.map