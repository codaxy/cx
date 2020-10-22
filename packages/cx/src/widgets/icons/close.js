import { VDOM } from "../../ui/Widget";
import { registerIcon } from "./registry";

export default registerIcon(
   "close",
   (props) => {
      return (
         <svg {...props} viewBox="0 0 32 32">
            <path
               fill="currentColor"
               strokeWidth="1"
               stroke="currentColor"
               d="M17.8 16l9.84-9.84c.48-.48.48-1.2 0-1.68s-1.2-.48-1.68 0l-9.84 9.84L6.04 4.36c-.48-.48-1.2-.48-1.68 0s-.48 1.2 0 1.68L14.32 16l-9.96 9.96c-.48.48-.48 1.2 0 1.68s1.2.48 1.68 0L16 17.68l9.96 9.96c.48.48 1.2.48 1.68 0s.48-1.2 0-1.68L17.8 16z"
            />
         </svg>
      );
   },
   true
);
