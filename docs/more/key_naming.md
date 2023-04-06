---
sidebar_position: 4
---

# Renaming The Key Programatically

:::note
This requires access to the account and the REST API sadly. This is a slight deviation from the "BLE" theme of this entire documentation, but is pretty nice if you do have access to the account.

I would also like to give huge thanks to the developers at [Tessie](https://www.tessie.com/) for discovering this and informing me about it!

For more info on how to use the Tesla REST API, please visit [timdorr's docs](https://tesla-api.timdorr.com/)
:::

## Some Information

You might want to give the key you have just added a name and a model, and possibly include your product's name in one of the 2. This is possible through the REST API. It can be done as many times as needed and will be updated in the vehicle whenever the "Locks" menu is opened.

Warning though, once the name is set, the user will no longer be able to change it inside the car UI, so preferably set it to something meaningful, and give the user the option to modify it somehow.

## What to send

### Body

```json
{
  "kind": "mobile_device",
  "public_key": "04ed05567b306981f02450193a9266e7e3b32927f4316bec89d0737c14016819c58bfbcd3070d690ad6778a702c0b70f20434e6172ce286ea70d87d7ba5d5e6b9b",
  "name": "Lex's iPhone",
  "model": "iPhone 14 Pro Max - Some App"
}
```

| Option       | Is required? | Description                                                                                                          |
| ------------ | ------------ | -------------------------------------------------------------------------------------------------------------------- |
| `kind`       | `required`   | Must be set to `mobile_device` (more values possibly exist, but are unknown)                                         |
| `public_key` | `required`   | Must be set the hex representation of the public key as encoded in [Getting Started](../start#whitelisting-your-key) |
| `name`       | `optional`   | Can be set if you wish to change the current name (big text) of the key                                              |
| `model`      | `optional`   | Can be set if you wish to change the current model (subtext) of the key                                              |

### Headers

Set the `Authorization` and `Content-Type` header, as per usual with Tesla's REST API

### Finishing up

Send all of this over to `https://owner-api.teslamotors.com/api/1/users/keys`, and once you reenter the "Locks" menu in the car, you should now see the updated info for the key!

## Key Kinds

Currently known values:

| Kind            | Description                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `mobile_device` | A `mobile_device` must be added over BLE for this kind to work, and should be used for phones and alike                           |
| `key_card`      | A `key_card` must be added over NFC to work, and should be used for thing like key cards and others, that communicate through NFC |
