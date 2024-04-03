export const sendWhatsAppMessage = async () => {
  const rawResponse = await fetch(
    "https://graph.facebook.com/v18.0/263611196840658/messages",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization:
          "Bearer EAAUtnNZB03NsBOyrQjZAa4P4wpmRK1WYu2J0gtKwo6vbZCEVj9YFQmAEw5ZBBsNIrhdWDKLZBItw5GotikPHkCmIkNkI6aXjVY4ZCZAh8oleZBEr5r3nDLbfIkkUf6A7nixi6k5Pq4AVEc9ven8cSAsTtK0ZAECOziamloHKKrjANGUcs7tGDlhDrsQh5MLZBdZAZCLs8CiA2pljxIqFy3V6",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: "21694300287",
        type: "template",
        template: { name: "hello_world", language: { code: "en_US" } },
      }),
    }
  );
  const content = await rawResponse.json();
  console.log(content);
};
