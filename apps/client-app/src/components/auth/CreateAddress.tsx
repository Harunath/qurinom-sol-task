"use client";
import { useRouter } from "next/navigation";
import AddressForm from "../user/AddressForm";

const CreateAddress = () => {
	const router = useRouter();
	return (
		<div>
			<AddressForm
				mode="create"
				onSuccess={() => {
					router.push("/register/done");
				}}
			/>
		</div>
	);
};

export default CreateAddress;
