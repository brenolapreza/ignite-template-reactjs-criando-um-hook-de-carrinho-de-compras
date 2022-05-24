import axios from "axios";
import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.find((product) => product.id === productId);
      console.log(productId);

      if (!productInCart) {
        const productCart = await api
          .get<Product>("/products/" + productId)
          .then((res) => res.data);
        const stock = await api
          .get<Stock>("/stock/" + productId)
          .then((res) => res.data);
        if (stock.amount > 0) {
          //Definindo amount como 1, pois é a quantidade que foi adicionada no carrinho.
          setCart([...cart, { ...productCart, amount: 1 }]);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify([...cart, { ...productCart, amount: 1 }])
          );
          toast("Adicionado");
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
      if (productInCart) {
        const stock = await api
          .get<Stock>("/stock/" + productId)
          .then((res) => res.data);
        if (stock.amount > productInCart.amount) {
          const updateCart = cart.map((item) =>
            item.id === productId
              ? {
                  ...item,
                  amount: Number(productInCart.amount) + 1,
                }
              : item
          );

          setCart(updateCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
          toast("Adicionado");
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productInCart = cart.some((product) => product.id === productId);
      console.log(productInCart);

      if (productInCart === true) {
        const removeCart = cart.filter((item) => item.id !== productId);
        setCart(removeCart);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(removeCart));
        toast("Produto removido");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get<Stock>(`/stock/${productId}`).then(response => response.data)

      console.log(stock)
  
      if(amount < 0) {
        return;
      }

      if(amount < stock.amount){
        return;
      }

      const productInCart = [...cart]
       const productExists = productInCart.find(product => product.id === product.id)

       if(productExists){
         productExists.amount = amount
         setCart(productInCart)
       }
      
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
